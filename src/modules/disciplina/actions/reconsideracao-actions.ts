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
import { ehResponsavelDaSancao } from "@/modules/responsaveis/queries/portal";

import {
  decidirReconsideracaoSchema,
  solicitarReconsideracaoSchema,
} from "../schemas/reconsideracao-schemas";
import { proximoNumero } from "../services/numeracao-service";
import {
  valorMovimentoCompensatorio,
  valorMovimentoSancao,
} from "../services/pontuacao";
import { formatarNumeroPublicacao } from "../services/sancao-rules";
import {
  agravaSancao,
  dentroDoPrazoReconsideracao,
  formatarNumeroDespacho,
  perfilDecisorReconsideracao,
  perfilPodeDecidirReconsideracao,
  podeDecidirReconsideracao,
  podeSolicitarReconsideracao,
  prazoFinalReconsideracao,
  type CompetenciaReconsideracao,
} from "../services/reconsideracao-rules";

function caminho(ocorrenciaId: string) {
  return `/disciplina/ocorrencias/${ocorrenciaId}`;
}

export async function solicitarReconsideracaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RECONSIDERACOES_CREATE);
  const parsed = solicitarReconsideracaoSchema.safeParse({
    sancaoId: formData.get("sancaoId"),
    texto: formData.get("texto"),
  });
  if (!parsed.success) {
    return actionError("Descreva os fundamentos do pedido.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const sancao = await tx.sancao.findFirst({
        where: {
          id: parsed.data.sancaoId,
          ocorrenciaAluno: { ocorrencia: { colegioId: context.colegioId } },
        },
        select: {
          id: true,
          status: true,
          impactoPontos: true,
          aplicadaEm: true,
          tipoSancaoCodigo: true,
          ocorrenciaAlunoId: true,
          ocorrenciaAluno: {
            select: { alunoId: true, ocorrenciaId: true },
          },
          reconsideracoes: {
            where: { status: "PENDENTE" },
            select: { id: true },
          },
        },
      });
      if (!sancao) {
        throw new Error("SANCAO_NAO_ENCONTRADA");
      }
      if (
        !context.permissoes.includes(PERMISSIONS.OCORRENCIAS_READ_SCHOOL) &&
        !(await ehResponsavelDaSancao(context.usuarioId, sancao.id))
      ) {
        throw new Error("SEM_ACESSO");
      }
      if (
        !podeSolicitarReconsideracao(
          sancao.status,
          sancao.reconsideracoes.length > 0,
        )
      ) {
        throw new Error("RECONSIDERACAO_INDISPONIVEL");
      }
      if (!dentroDoPrazoReconsideracao(sancao.aplicadaEm, new Date())) {
        throw new Error("FORA_DO_PRAZO");
      }

      const reconsideracao = await tx.reconsideracao.create({
        data: {
          sancaoId: sancao.id,
          ocorrenciaAlunoId: sancao.ocorrenciaAlunoId,
          solicitanteId: context.usuarioId,
          texto: parsed.data.texto,
          prazoFinal: prazoFinalReconsideracao(sancao.aplicadaEm),
        },
      });

      // anexoA secao 12: enquanto pendente, suspender os efeitos da sancao.
      if (sancao.status === "ATIVA" || sancao.status === "CUMPRIDA") {
        await tx.sancao.update({
          where: { id: sancao.id },
          data: { status: "SUSPENSA" },
        });
        await tx.modificacaoSancao.create({
          data: {
            sancaoId: sancao.id,
            tipo: "SUSPENSAO_EFEITOS",
            motivo: "Reconsideração pendente",
            registradoPorId: context.usuarioId,
          },
        });
        await tx.movimentoPontuacao.create({
          data: {
            alunoId: sancao.ocorrenciaAluno.alunoId,
            colegioId: context.colegioId,
            tipo: "AJUSTE_ADMINISTRATIVO",
            valor: valorMovimentoCompensatorio(Number(sancao.impactoPontos)),
            origemTipo: "sancao_suspensao",
            origemId: sancao.id,
            descricao: `Suspensão de efeitos da sanção ${sancao.tipoSancaoCodigo} (reconsideração pendente)`,
            registradoPorId: context.usuarioId,
          },
        });
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "SOLICITACAO_RECONSIDERACAO",
          entidade: "reconsideracoes",
          entidadeId: reconsideracao.id,
          dadosNovos: { sancaoId: sancao.id },
          metadata,
        },
        tx,
      );

      return sancao.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    revalidatePath("/disciplina/reconsideracoes");
    return actionSuccess(
      "Pedido de reconsideração registrado. Efeitos da sanção suspensos.",
    );
  } catch (error) {
    return mapErro(error);
  }
}

async function proximaSequencia(
  tx: Prisma.TransactionClient,
  modelo: "reconsideracao" | "sancao",
  colegioId: string,
  ano: number,
): Promise<number> {
  return proximoNumero(
    tx,
    colegioId,
    modelo === "reconsideracao" ? "RECONSIDERACAO" : "SANCAO",
    ano,
  );
}

export async function decidirReconsideracaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RECONSIDERACOES_DECIDE);
  const parsed = decidirReconsideracaoSchema.safeParse({
    reconsideracaoId: formData.get("reconsideracaoId"),
    resultado: formData.get("resultado"),
    parecer: formData.get("parecer"),
    novoTipoSancaoCodigo: formData.get("novoTipoSancaoCodigo") ?? undefined,
    novosDias: formData.get("novosDias") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Confira o parecer da reconsideração.");
  }

  const ehAdmin = context.perfis.includes(ROLE_CODES.ADMINISTRADOR);
  const deferir = parsed.data.resultado === "DEFERIR";

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const reconsideracao = await tx.reconsideracao.findFirst({
        where: {
          id: parsed.data.reconsideracaoId,
          ocorrenciaAluno: { ocorrencia: { colegioId: context.colegioId } },
        },
        select: {
          id: true,
          status: true,
          sancaoId: true,
          ocorrenciaAlunoId: true,
          ocorrenciaAluno: {
            select: {
              alunoId: true,
              ocorrenciaId: true,
              ocorrencia: { select: { colegio: { select: { codigo: true } } } },
            },
          },
          sancao: {
            select: {
              id: true,
              status: true,
              dias: true,
              impactoPontos: true,
              tipoSancaoCodigo: true,
              decisao: { select: { naturezaApurada: true } },
            },
          },
        },
      });
      if (!reconsideracao) {
        throw new Error("RECONSIDERACAO_NAO_ENCONTRADA");
      }
      if (!podeDecidirReconsideracao(reconsideracao.status)) {
        throw new Error("RECONSIDERACAO_INDISPONIVEL");
      }

      const natureza = reconsideracao.sancao.decisao.naturezaApurada;
      if (!natureza) {
        throw new Error("NATUREZA_INDEFINIDA");
      }

      let perfilDecisor = context.perfis[0] ?? ROLE_CODES.ADMINISTRADOR;
      if (!ehAdmin) {
        const competenciasRaw = await tx.competenciaDisciplinar.findMany({
          where: {
            tipoAto: "DECIDIR_RECONSIDERACAO",
            ativo: true,
            perfilCodigo: { in: context.perfis },
          },
          select: { perfilCodigo: true, naturezaMax: true },
        });
        const competencias: CompetenciaReconsideracao[] = competenciasRaw.map(
          (c) => ({ perfilCodigo: c.perfilCodigo, naturezaMax: c.naturezaMax }),
        );
        if (!perfilPodeDecidirReconsideracao(natureza, competencias)) {
          throw new Error("SEM_COMPETENCIA");
        }
        perfilDecisor =
          perfilDecisorReconsideracao(natureza, competencias) ?? perfilDecisor;
      } else {
        perfilDecisor = ROLE_CODES.ADMINISTRADOR;
      }

      const tiposSancao = await tx.tipoSancao.findMany({
        select: { codigo: true, ordem: true, impactoPontos: true },
      });
      const ordemPorCodigo = new Map(tiposSancao.map((t) => [t.codigo, t.ordem]));
      const ordemAtual =
        ordemPorCodigo.get(reconsideracao.sancao.tipoSancaoCodigo) ?? 0;

      let novaSancaoId: string | null = null;
      if (deferir && parsed.data.novoTipoSancaoCodigo) {
        const novoTipo = tiposSancao.find(
          (t) => t.codigo === parsed.data.novoTipoSancaoCodigo,
        );
        if (!novoTipo) {
          throw new Error("SANCAO_INVALIDA");
        }
        if (
          agravaSancao(
            ordemAtual,
            reconsideracao.sancao.dias,
            novoTipo.ordem,
            parsed.data.novosDias ?? null,
          )
        ) {
          throw new Error("AGRAVA_SANCAO");
        }
      }

      const ano = new Date().getFullYear();
      const seqDespacho = await proximaSequencia(
        tx,
        "reconsideracao",
        context.colegioId,
        ano,
      );
      const numeroDespacho = formatarNumeroDespacho(
        reconsideracao.ocorrenciaAluno.ocorrencia.colegio.codigo,
        ano,
        seqDespacho,
      );

      if (deferir) {
        // A sancao original e anulada; os efeitos ja estavam suspensos.
        await tx.sancao.update({
          where: { id: reconsideracao.sancaoId },
          data: { status: "ANULADA" },
        });
        await tx.modificacaoSancao.create({
          data: {
            sancaoId: reconsideracao.sancaoId,
            tipo: "ANULACAO",
            motivo: "Reconsideração deferida",
            registradoPorId: context.usuarioId,
          },
        });

        if (parsed.data.novoTipoSancaoCodigo) {
          const novoTipo = tiposSancao.find(
            (t) => t.codigo === parsed.data.novoTipoSancaoCodigo,
          )!;
          const seqBoletim = await proximaSequencia(
            tx,
            "sancao",
            context.colegioId,
            ano,
          );
          const numeroBoletim = formatarNumeroPublicacao(
            reconsideracao.ocorrenciaAluno.ocorrencia.colegio.codigo,
            ano,
            seqBoletim,
          );
          const nova = await tx.sancao.create({
            data: {
              ocorrenciaAlunoId: reconsideracao.ocorrenciaAlunoId,
              decisaoId: (
                await tx.sancao.findUniqueOrThrow({
                  where: { id: reconsideracao.sancaoId },
                  select: { decisaoId: true },
                })
              ).decisaoId,
              tipoSancaoCodigo: novoTipo.codigo,
              dias: parsed.data.novosDias ?? null,
              impactoPontos: novoTipo.impactoPontos,
              numeroPublicacao: numeroBoletim,
              sequencial: seqBoletim,
              anoNumeracao: ano,
              observacao: "Sanção revista em reconsideração",
              aplicadaPorId: context.usuarioId,
            },
          });
          await tx.movimentoPontuacao.create({
            data: {
              alunoId: reconsideracao.ocorrenciaAluno.alunoId,
              colegioId: context.colegioId,
              tipo: "SANCAO",
              valor: valorMovimentoSancao(Number(novoTipo.impactoPontos)),
              origemTipo: "sancao",
              origemId: nova.id,
              descricao: `Sanção revista ${novoTipo.codigo} (${numeroBoletim})`,
              registradoPorId: context.usuarioId,
            },
          });
          novaSancaoId = nova.id;
        }
      } else {
        // Indeferida: retomar os efeitos da sancao original.
        await tx.sancao.update({
          where: { id: reconsideracao.sancaoId },
          data: { status: "ATIVA" },
        });
        await tx.modificacaoSancao.create({
          data: {
            sancaoId: reconsideracao.sancaoId,
            tipo: "RETOMADA_EFEITOS",
            motivo: "Reconsideração indeferida",
            registradoPorId: context.usuarioId,
          },
        });
        await tx.movimentoPontuacao.create({
          data: {
            alunoId: reconsideracao.ocorrenciaAluno.alunoId,
            colegioId: context.colegioId,
            tipo: "AJUSTE_ADMINISTRATIVO",
            valor: valorMovimentoSancao(
              Number(reconsideracao.sancao.impactoPontos),
            ),
            origemTipo: "sancao_retomada",
            origemId: reconsideracao.sancaoId,
            descricao: `Retomada de efeitos da sanção ${reconsideracao.sancao.tipoSancaoCodigo} (reconsideração indeferida)`,
            registradoPorId: context.usuarioId,
          },
        });
      }

      await tx.reconsideracao.update({
        where: { id: reconsideracao.id },
        data: {
          status: deferir ? "DEFERIDA" : "INDEFERIDA",
          parecerDecisao: parsed.data.parecer,
          decididoPorId: context.usuarioId,
          decididoPorPerfilCodigo: perfilDecisor,
          decididaEm: new Date(),
          novoTipoSancaoCodigo: deferir
            ? (parsed.data.novoTipoSancaoCodigo ?? null)
            : null,
          novosDias: deferir ? (parsed.data.novosDias ?? null) : null,
          numero: numeroDespacho,
          sequencial: seqDespacho,
          anoNumeracao: ano,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "DECISAO_RECONSIDERACAO",
          entidade: "reconsideracoes",
          entidadeId: reconsideracao.id,
          dadosNovos: {
            resultado: deferir ? "DEFERIDA" : "INDEFERIDA",
            numero: numeroDespacho,
            novaSancaoId,
          },
          metadata,
        },
        tx,
      );

      return reconsideracao.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    revalidatePath("/disciplina/reconsideracoes");
    return actionSuccess(
      deferir
        ? "Reconsideração deferida."
        : "Reconsideração indeferida. Efeitos da sanção retomados.",
    );
  } catch (error) {
    return mapErro(error);
  }
}

function mapErro(error: unknown): ActionState {
  const mensagens: Record<string, string> = {
    SANCAO_NAO_ENCONTRADA: "Sanção não encontrada no colégio ativo.",
    SEM_ACESSO: "Você não tem acesso a esta sanção.",
    RECONSIDERACAO_NAO_ENCONTRADA: "Reconsideração não encontrada.",
    RECONSIDERACAO_INDISPONIVEL:
      "Já existe reconsideração pendente ou a sanção não permite.",
    FORA_DO_PRAZO: "O prazo de 15 dias para reconsideração expirou.",
    NATUREZA_INDEFINIDA: "A decisão não tem natureza apurada.",
    SEM_COMPETENCIA:
      "Seu perfil não tem competência para decidir esta reconsideração (anexo A, seção 12).",
    SANCAO_INVALIDA: "Tipo de sanção inválido.",
    AGRAVA_SANCAO: "A decisão do recurso não pode agravar a sanção.",
  };
  if (error instanceof Error && mensagens[error.message]) {
    return actionError(mensagens[error.message]);
  }
  return actionError("Não foi possível concluir a operação.");
}
