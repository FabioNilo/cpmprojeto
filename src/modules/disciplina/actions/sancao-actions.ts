"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  aplicarSancaoSchema,
  cumprimentoSancaoSchema,
  modificarSancaoSchema,
} from "../schemas/sancao-schemas";
import {
  competenciaPermiteSancao,
  type CompetenciaSancao,
} from "../services/decisao-rules";
import { proximoNumero } from "../services/numeracao-service";
import {
  valorMovimentoCompensatorio,
  valorMovimentoSancao,
} from "../services/pontuacao";
import {
  formatarNumeroPublicacao,
  podeAnularSancao,
  podeAplicarSancao,
  podeRegistrarCumprimento,
  podeRetomarEfeitos,
  podeSuspenderEfeitos,
  resolverImpactoSancao,
} from "../services/sancao-rules";

function caminho(ocorrenciaId: string) {
  return `/disciplina/ocorrencias/${ocorrenciaId}`;
}

async function validarCompetencia(
  tx: Prisma.TransactionClient,
  perfis: string[],
  tipoSancaoCodigo: string,
  dias: number | null,
) {
  if (perfis.includes(ROLE_CODES.ADMINISTRADOR)) {
    return;
  }
  const [tipos, competenciasRaw] = await Promise.all([
    tx.tipoSancao.findMany({ select: { codigo: true, ordem: true } }),
    tx.competenciaDisciplinar.findMany({
      where: {
        tipoAto: "APLICAR_SANCAO",
        ativo: true,
        perfilCodigo: { in: perfis },
      },
      select: { perfilCodigo: true, tipoSancaoMaxCodigo: true, diasMax: true },
    }),
  ]);
  const ordemPorCodigo = new Map(tipos.map((t) => [t.codigo, t.ordem]));
  const alvo = ordemPorCodigo.get(tipoSancaoCodigo);
  if (alvo === undefined) {
    throw new Error("SANCAO_INVALIDA");
  }
  const competencias: CompetenciaSancao[] = competenciasRaw.map((c) => ({
    perfilCodigo: c.perfilCodigo,
    sancaoMaxOrdem: c.tipoSancaoMaxCodigo
      ? (ordemPorCodigo.get(c.tipoSancaoMaxCodigo) ?? null)
      : null,
    diasMax: c.diasMax,
  }));
  if (!competenciaPermiteSancao(competencias, alvo, dias)) {
    throw new Error("SEM_COMPETENCIA");
  }
}

export async function aplicarSancaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.SANCOES_APPLY);
  const parsed = aplicarSancaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    decisaoId: formData.get("decisaoId"),
    observacao: formData.get("observacao") ?? undefined,
    impactoPontosManual: formData.get("impactoPontosManual") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Dados inválidos para aplicar a sanção.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await tx.ocorrenciaAluno.findFirst({
        where: {
          id: parsed.data.ocorrenciaAlunoId,
          ocorrencia: { colegioId: context.colegioId },
        },
        select: {
          id: true,
          alunoId: true,
          ocorrenciaId: true,
          ocorrencia: { select: { colegio: { select: { codigo: true } } } },
          aluno: { select: { necessidadeEspecial: true } },
          decisoes: {
            where: { id: parsed.data.decisaoId },
            select: {
              id: true,
              resultado: true,
              revogadoEm: true,
              sancaoTipoCodigo: true,
              diasSancao: true,
            },
          },
          sancoes: { select: { id: true, status: true } },
        },
      });
      if (!processo || processo.decisoes.length === 0) {
        throw new Error("DECISAO_NAO_ENCONTRADA");
      }
      const decisao = processo.decisoes[0];
      const jaTemSancao = processo.sancoes.some((s) => s.status !== "ANULADA");
      if (
        !podeAplicarSancao(
          decisao.resultado,
          decisao.revogadoEm !== null,
          jaTemSancao,
        )
      ) {
        throw new Error("SANCAO_INDISPONIVEL");
      }
      if (!decisao.sancaoTipoCodigo) {
        throw new Error("DECISAO_SEM_SANCAO");
      }

      const tipoSancao = await tx.tipoSancao.findFirst({
        where: { codigo: decisao.sancaoTipoCodigo, ativo: true },
        select: { codigo: true, nome: true, impactoPontos: true },
      });
      if (!tipoSancao) {
        throw new Error("SANCAO_INVALIDA");
      }

      await validarCompetencia(
        tx,
        context.perfis,
        tipoSancao.codigo,
        decisao.diasSancao ?? null,
      );

      const ano = new Date().getFullYear();
      const sequencial = await proximoNumero(
        tx,
        context.colegioId,
        "SANCAO",
        ano,
      );
      const numeroPublicacao = formatarNumeroPublicacao(
        processo.ocorrencia.colegio.codigo,
        ano,
        sequencial,
      );

      const { impactoPontos: impacto, impactoManual } = resolverImpactoSancao(
        processo.aluno.necessidadeEspecial,
        Number(tipoSancao.impactoPontos),
        parsed.data.impactoPontosManual ?? null,
      );
      const sancao = await tx.sancao.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          decisaoId: decisao.id,
          tipoSancaoCodigo: tipoSancao.codigo,
          dias: decisao.diasSancao ?? null,
          impactoPontos: impacto,
          impactoManual,
          numeroPublicacao,
          sequencial,
          anoNumeracao: ano,
          observacao: parsed.data.observacao,
          aplicadaPorId: context.usuarioId,
        },
      });

      await tx.movimentoPontuacao.create({
        data: {
          alunoId: processo.alunoId,
          colegioId: context.colegioId,
          tipo: "SANCAO",
          valor: valorMovimentoSancao(impacto),
          origemTipo: "sancao",
          origemId: sancao.id,
          descricao: `Sanção ${tipoSancao.codigo} (${numeroPublicacao})`,
          registradoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "APLICACAO_SANCAO",
          entidade: "sancoes",
          entidadeId: sancao.id,
          dadosNovos: {
            tipo: tipoSancao.codigo,
            dias: sancao.dias,
            impacto,
            impactoManual,
            impactoCatalogo: Number(tipoSancao.impactoPontos),
            numeroPublicacao,
          },
          metadata,
        },
        tx,
      );

      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Sanção aplicada e lançada no histórico de pontuação.");
  } catch (error) {
    return mapErro(error);
  }
}

async function carregarSancao(
  tx: Prisma.TransactionClient,
  sancaoId: string,
  ocorrenciaAlunoId: string,
  colegioId: string,
) {
  return tx.sancao.findFirst({
    where: {
      id: sancaoId,
      ocorrenciaAlunoId,
      ocorrenciaAluno: { ocorrencia: { colegioId } },
    },
    select: {
      id: true,
      status: true,
      impactoPontos: true,
      tipoSancaoCodigo: true,
      ocorrenciaAluno: { select: { alunoId: true, ocorrenciaId: true } },
    },
  });
}

export async function anularSancaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.SANCOES_APPLY);
  const parsed = modificarSancaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    sancaoId: formData.get("sancaoId"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) {
    return actionError("Informe o motivo da anulação.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const sancao = await carregarSancao(
        tx,
        parsed.data.sancaoId,
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!sancao) {
        throw new Error("SANCAO_NAO_ENCONTRADA");
      }
      if (!podeAnularSancao(sancao.status)) {
        throw new Error("SANCAO_INDISPONIVEL");
      }

      await tx.sancao.update({
        where: { id: sancao.id },
        data: { status: "ANULADA" },
      });
      await tx.modificacaoSancao.create({
        data: {
          sancaoId: sancao.id,
          tipo: "ANULACAO",
          motivo: parsed.data.motivo,
          registradoPorId: context.usuarioId,
        },
      });
      await tx.movimentoPontuacao.create({
        data: {
          alunoId: sancao.ocorrenciaAluno.alunoId,
          colegioId: context.colegioId,
          tipo: "AJUSTE_ADMINISTRATIVO",
          valor: valorMovimentoCompensatorio(Number(sancao.impactoPontos)),
          origemTipo: "sancao_anulacao",
          origemId: sancao.id,
          descricao: `Anulação da sanção ${sancao.tipoSancaoCodigo}: ${parsed.data.motivo}`,
          registradoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ANULACAO_SANCAO",
          entidade: "sancoes",
          entidadeId: sancao.id,
          dadosNovos: { motivo: parsed.data.motivo },
          metadata,
        },
        tx,
      );

      return sancao.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Sanção anulada. Pontos revertidos no histórico.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function registrarCumprimentoSancaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.SANCOES_APPLY);
  const parsed = cumprimentoSancaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    sancaoId: formData.get("sancaoId"),
    motivo: formData.get("motivo") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Dados inválidos.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const sancao = await carregarSancao(
        tx,
        parsed.data.sancaoId,
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!sancao) {
        throw new Error("SANCAO_NAO_ENCONTRADA");
      }
      if (!podeRegistrarCumprimento(sancao.status)) {
        throw new Error("SANCAO_INDISPONIVEL");
      }

      await tx.sancao.update({
        where: { id: sancao.id },
        data: { status: "CUMPRIDA", cumpridaEm: new Date() },
      });
      await tx.modificacaoSancao.create({
        data: {
          sancaoId: sancao.id,
          tipo: "CUMPRIMENTO",
          motivo: parsed.data.motivo,
          registradoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CUMPRIMENTO_SANCAO",
          entidade: "sancoes",
          entidadeId: sancao.id,
          metadata,
        },
        tx,
      );

      return sancao.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Cumprimento registrado.");
  } catch (error) {
    return mapErro(error);
  }
}

async function alternarEfeitos(
  formData: FormData,
  suspender: boolean,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.SANCOES_APPLY);
  const parsed = modificarSancaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    sancaoId: formData.get("sancaoId"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) {
    return actionError("Informe o motivo.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const sancao = await carregarSancao(
        tx,
        parsed.data.sancaoId,
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!sancao) {
        throw new Error("SANCAO_NAO_ENCONTRADA");
      }
      const permitido = suspender
        ? podeSuspenderEfeitos(sancao.status)
        : podeRetomarEfeitos(sancao.status);
      if (!permitido) {
        throw new Error("SANCAO_INDISPONIVEL");
      }

      const impacto = Number(sancao.impactoPontos);
      await tx.sancao.update({
        where: { id: sancao.id },
        data: { status: suspender ? "SUSPENSA" : "ATIVA" },
      });
      await tx.modificacaoSancao.create({
        data: {
          sancaoId: sancao.id,
          tipo: suspender ? "SUSPENSAO_EFEITOS" : "RETOMADA_EFEITOS",
          motivo: parsed.data.motivo,
          registradoPorId: context.usuarioId,
        },
      });
      await tx.movimentoPontuacao.create({
        data: {
          alunoId: sancao.ocorrenciaAluno.alunoId,
          colegioId: context.colegioId,
          tipo: "AJUSTE_ADMINISTRATIVO",
          valor: suspender
            ? valorMovimentoCompensatorio(impacto)
            : valorMovimentoSancao(impacto),
          origemTipo: suspender ? "sancao_suspensao" : "sancao_retomada",
          origemId: sancao.id,
          descricao: `${
            suspender ? "Suspensão" : "Retomada"
          } dos efeitos da sanção ${sancao.tipoSancaoCodigo}: ${parsed.data.motivo}`,
          registradoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: suspender
            ? "SUSPENSAO_EFEITOS_SANCAO"
            : "RETOMADA_EFEITOS_SANCAO",
          entidade: "sancoes",
          entidadeId: sancao.id,
          dadosNovos: { motivo: parsed.data.motivo },
          metadata,
        },
        tx,
      );

      return sancao.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess(
      suspender
        ? "Efeitos da sanção suspensos."
        : "Efeitos da sanção retomados.",
    );
  } catch (error) {
    return mapErro(error);
  }
}

export async function suspenderEfeitosSancaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return alternarEfeitos(formData, true);
}

export async function retomarEfeitosSancaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return alternarEfeitos(formData, false);
}

function mapErro(error: unknown): ActionState {
  const mensagens: Record<string, string> = {
    DECISAO_NAO_ENCONTRADA: "Decisão não encontrada no colégio ativo.",
    DECISAO_SEM_SANCAO: "A decisão não prevê sanção.",
    SANCAO_NAO_ENCONTRADA: "Sanção não encontrada.",
    SANCAO_INDISPONIVEL: "A sanção não está neste estado.",
    SANCAO_INVALIDA: "Tipo de sanção inválido.",
    SEM_COMPETENCIA:
      "Seu perfil não tem competência para esta sanção (anexo A, seção 7).",
  };
  if (error instanceof Error && mensagens[error.message]) {
    return actionError(mensagens[error.message]);
  }
  return actionError("Não foi possível concluir a operação.");
}
