"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { isUniqueConstraintError } from "@/lib/db/prisma-errors";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  registrarDecisaoSchema,
  registrarEnquadramentoSchema,
  revogarDecisaoSchema,
  revogarEnquadramentoSchema,
} from "../schemas/decisao-schemas";
import {
  competenciaPermiteSancao,
  exigeEnquadramento,
  exigeSancao,
  formatarNumeroDecisao,
  naturezaMaisGrave,
  perfilComCompetencia,
  podeDecidir,
  podeEnquadrar,
  statusProcessoAposDecisao,
  type CompetenciaSancao,
} from "../services/decisao-rules";
import { proximoNumero } from "../services/numeracao-service";
import { reavaliarOcorrencia } from "../services/ocorrencia-status-service";

function caminho(ocorrenciaId: string) {
  return `/disciplina/ocorrencias/${ocorrenciaId}`;
}

async function carregarProcesso(id: string, colegioId: string) {
  return prisma.ocorrenciaAluno.findFirst({
    where: { id, ocorrencia: { colegioId } },
    select: {
      id: true,
      status: true,
      ocorrenciaId: true,
      ocorrencia: {
        select: {
          id: true,
          status: true,
          colegio: { select: { codigo: true } },
        },
      },
    },
  });
}

export async function registrarEnquadramentoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ENQUADRAMENTOS_MANAGE);
  const parsed = registrarEnquadramentoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    transgressaoId: formData.get("transgressaoId"),
    fundamentacao: formData.get("fundamentacao") ?? undefined,
  });

  if (!parsed.success) {
    return actionError("Selecione a transgressão para enquadrar.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await carregarProcesso(
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }
      if (!podeEnquadrar(processo.ocorrencia.status, processo.status)) {
        throw new Error("ANALISE_INDISPONIVEL");
      }

      const transgressao = await tx.transgressao.findFirst({
        where: { id: parsed.data.transgressaoId, ativo: true },
        select: { id: true, codigo: true, natureza: true },
      });
      if (!transgressao) {
        throw new Error("TRANSGRESSAO_INVALIDA");
      }

      const enquadramento = await tx.enquadramentoDisciplinar.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          transgressaoId: transgressao.id,
          natureza: transgressao.natureza,
          fundamentacao: parsed.data.fundamentacao,
          registradoPorId: context.usuarioId,
        },
      });

      if (
        processo.ocorrencia.status === "EM_AVERIGUACAO" ||
        processo.ocorrencia.status === "AGUARDANDO_MANIFESTACAO" ||
        processo.ocorrencia.status === "AGUARDANDO_CIENCIA"
      ) {
        await tx.ocorrencia.update({
          where: { id: processo.ocorrenciaId },
          data: { status: "EM_ANALISE" },
        });
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REGISTRO_ENQUADRAMENTO",
          entidade: "enquadramentos_disciplinares",
          entidadeId: enquadramento.id,
          dadosNovos: {
            ocorrenciaAlunoId: processo.id,
            transgressao: transgressao.codigo,
            natureza: transgressao.natureza,
          },
          metadata,
        },
        tx,
      );

      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Enquadramento registrado.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function revogarEnquadramentoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ENQUADRAMENTOS_MANAGE);
  const parsed = revogarEnquadramentoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    enquadramentoId: formData.get("enquadramentoId"),
  });

  if (!parsed.success) {
    return actionError("Enquadramento inválido.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const enquadramento = await tx.enquadramentoDisciplinar.findFirst({
        where: {
          id: parsed.data.enquadramentoId,
          revogadoEm: null,
          ocorrenciaAluno: {
            id: parsed.data.ocorrenciaAlunoId,
            ocorrencia: { colegioId: context.colegioId },
          },
        },
        select: {
          id: true,
          ocorrenciaAluno: {
            select: {
              status: true,
              ocorrenciaId: true,
              decisoes: { where: { revogadoEm: null }, select: { id: true } },
            },
          },
        },
      });
      if (!enquadramento) {
        throw new Error("ENQUADRAMENTO_NAO_ENCONTRADO");
      }
      if (enquadramento.ocorrenciaAluno.decisoes.length > 0) {
        throw new Error("DECISAO_EXISTENTE");
      }
      if (enquadramento.ocorrenciaAluno.status !== "PENDENTE") {
        throw new Error("ANALISE_INDISPONIVEL");
      }

      await tx.enquadramentoDisciplinar.update({
        where: { id: enquadramento.id },
        data: { revogadoEm: new Date(), revogadoPorId: context.usuarioId },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REVOGACAO_ENQUADRAMENTO",
          entidade: "enquadramentos_disciplinares",
          entidadeId: enquadramento.id,
          metadata,
        },
        tx,
      );

      return enquadramento.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Enquadramento revogado.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function registrarDecisaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.DECISOES_REGISTER);
  const parsed = registrarDecisaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    resultado: formData.get("resultado"),
    sancaoTipoCodigo: formData.get("sancaoTipoCodigo") ?? undefined,
    diasSancao: formData.get("diasSancao") ?? undefined,
    fundamentacao: formData.get("fundamentacao"),
    atenuanteIds: formData.getAll("atenuanteIds"),
    agravanteIds: formData.getAll("agravanteIds"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da decisão.");
  }

  const ehAdministrador = context.perfis.includes(ROLE_CODES.ADMINISTRADOR);

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
          status: true,
          ocorrenciaId: true,
          ocorrencia: {
            select: { status: true, colegio: { select: { codigo: true } } },
          },
          enquadramentos: {
            where: { revogadoEm: null },
            select: { natureza: true },
          },
          decisoes: { where: { revogadoEm: null }, select: { id: true } },
        },
      });
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }
      if (!podeDecidir(processo.ocorrencia.status, processo.status)) {
        throw new Error("ANALISE_INDISPONIVEL");
      }
      if (processo.decisoes.length > 0) {
        throw new Error("DECISAO_EXISTENTE");
      }
      if (
        exigeEnquadramento(parsed.data.resultado) &&
        processo.enquadramentos.length === 0
      ) {
        throw new Error("SEM_ENQUADRAMENTO");
      }

      const atenuanteIds = [...new Set(parsed.data.atenuanteIds)];
      const agravanteIds = [...new Set(parsed.data.agravanteIds)];
      if (atenuanteIds.length > 0) {
        const encontrados = await tx.atenuante.count({
          where: { id: { in: atenuanteIds }, ativo: true },
        });
        if (encontrados !== atenuanteIds.length) {
          throw new Error("CIRCUNSTANCIA_INVALIDA");
        }
      }
      if (agravanteIds.length > 0) {
        const encontrados = await tx.agravante.count({
          where: { id: { in: agravanteIds }, ativo: true },
        });
        if (encontrados !== agravanteIds.length) {
          throw new Error("CIRCUNSTANCIA_INVALIDA");
        }
      }

      let perfilCompetente = context.perfis[0] ?? ROLE_CODES.ADMINISTRADOR;

      if (exigeSancao(parsed.data.resultado)) {
        if (!parsed.data.sancaoTipoCodigo) {
          throw new Error("SANCAO_OBRIGATORIA");
        }
        const tipoSancao = await tx.tipoSancao.findFirst({
          where: { codigo: parsed.data.sancaoTipoCodigo, ativo: true },
          select: { codigo: true, ordem: true },
        });
        if (!tipoSancao) {
          throw new Error("SANCAO_INVALIDA");
        }

        if (ehAdministrador) {
          perfilCompetente = ROLE_CODES.ADMINISTRADOR;
        } else {
          const competenciasRaw = await tx.competenciaDisciplinar.findMany({
            where: {
              tipoAto: "APLICAR_SANCAO",
              ativo: true,
              perfilCodigo: { in: context.perfis },
            },
            select: {
              perfilCodigo: true,
              tipoSancaoMaxCodigo: true,
              diasMax: true,
            },
          });
          const tipos = await tx.tipoSancao.findMany({
            select: { codigo: true, ordem: true },
          });
          const ordemPorCodigo = new Map(
            tipos.map((t) => [t.codigo, t.ordem]),
          );
          const competencias: CompetenciaSancao[] = competenciasRaw.map((c) => ({
            perfilCodigo: c.perfilCodigo,
            sancaoMaxOrdem: c.tipoSancaoMaxCodigo
              ? (ordemPorCodigo.get(c.tipoSancaoMaxCodigo) ?? null)
              : null,
            diasMax: c.diasMax,
          }));

          const dias = parsed.data.diasSancao ?? null;
          if (
            !competenciaPermiteSancao(competencias, tipoSancao.ordem, dias)
          ) {
            throw new Error("SEM_COMPETENCIA");
          }
          perfilCompetente =
            perfilComCompetencia(competencias, tipoSancao.ordem, dias) ??
            perfilCompetente;
        }
      }

      const naturezaApurada = naturezaMaisGrave(
        processo.enquadramentos.map((e) => e.natureza),
      );

      const ano = new Date().getFullYear();
      const sequencial = await proximoNumero(
        tx,
        context.colegioId,
        "DECISAO",
        ano,
      );
      const numero = formatarNumeroDecisao(
        processo.ocorrencia.colegio.codigo,
        ano,
        sequencial,
      );

      const decisao = await tx.decisao.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          resultado: parsed.data.resultado,
          naturezaApurada,
          sancaoTipoCodigo: exigeSancao(parsed.data.resultado)
            ? parsed.data.sancaoTipoCodigo
            : null,
          diasSancao: exigeSancao(parsed.data.resultado)
            ? (parsed.data.diasSancao ?? null)
            : null,
          fundamentacao: parsed.data.fundamentacao,
          decididoPorId: context.usuarioId,
          decididoPorPerfilCodigo: perfilCompetente,
          numero,
          sequencial,
          anoNumeracao: ano,
          atenuantes: {
            create: atenuanteIds.map((atenuanteId) => ({ atenuanteId })),
          },
          agravantes: {
            create: agravanteIds.map((agravanteId) => ({ agravanteId })),
          },
        },
      });

      await tx.ocorrenciaAluno.update({
        where: { id: processo.id },
        data: { status: statusProcessoAposDecisao(parsed.data.resultado) },
      });

      await reavaliarOcorrencia(tx, processo.ocorrenciaId);

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REGISTRO_DECISAO",
          entidade: "decisoes",
          entidadeId: decisao.id,
          dadosNovos: {
            numero,
            resultado: parsed.data.resultado,
            sancao: decisao.sancaoTipoCodigo,
            dias: decisao.diasSancao,
          },
          metadata,
        },
        tx,
      );

      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Decisão registrada.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function revogarDecisaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.DECISOES_REGISTER);
  const parsed = revogarDecisaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    decisaoId: formData.get("decisaoId"),
  });

  if (!parsed.success) {
    return actionError("Decisão inválida.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const decisao = await tx.decisao.findFirst({
        where: {
          id: parsed.data.decisaoId,
          revogadoEm: null,
          ocorrenciaAluno: {
            id: parsed.data.ocorrenciaAlunoId,
            ocorrencia: { colegioId: context.colegioId },
          },
        },
        select: {
          id: true,
          ocorrenciaAluno: {
            select: {
              id: true,
              ocorrenciaId: true,
              ocorrencia: { select: { status: true } },
            },
          },
        },
      });
      if (!decisao) {
        throw new Error("DECISAO_NAO_ENCONTRADA");
      }
      if (decisao.ocorrenciaAluno.ocorrencia.status === "ENCERRADA") {
        throw new Error("OCORRENCIA_ENCERRADA");
      }

      await tx.decisao.update({
        where: { id: decisao.id },
        data: { revogadoEm: new Date(), revogadoPorId: context.usuarioId },
      });
      await tx.ocorrenciaAluno.update({
        where: { id: decisao.ocorrenciaAluno.id },
        data: { status: "PENDENTE" },
      });
      await reavaliarOcorrencia(tx, decisao.ocorrenciaAluno.ocorrenciaId);

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REVOGACAO_DECISAO",
          entidade: "decisoes",
          entidadeId: decisao.id,
          metadata,
        },
        tx,
      );

      return decisao.ocorrenciaAluno.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Decisão revogada. O processo voltou para análise.");
  } catch (error) {
    return mapErro(error);
  }
}

function mapErro(error: unknown): ActionState {
  const mensagens: Record<string, string> = {
    PROCESSO_NAO_ENCONTRADO: "Processo não encontrado no colégio ativo.",
    ANALISE_INDISPONIVEL:
      "Este processo não está em fase de análise/decisão.",
    TRANSGRESSAO_INVALIDA: "Transgressão inválida ou inativa.",
    ENQUADRAMENTO_NAO_ENCONTRADO: "Enquadramento não encontrado.",
    DECISAO_EXISTENTE:
      "Já existe uma decisão ativa. Revogue-a antes de registrar outra.",
    DECISAO_NAO_ENCONTRADA: "Decisão não encontrada.",
    OCORRENCIA_ENCERRADA: "A ocorrência já foi encerrada.",
    SEM_ENQUADRAMENTO:
      "Registre ao menos um enquadramento antes de decidir pela procedência.",
    SANCAO_OBRIGATORIA: "Informe o tipo de sanção para a decisão procedente.",
    SANCAO_INVALIDA: "Tipo de sanção inválido.",
    SEM_COMPETENCIA:
      "Seu perfil não tem competência para a sanção escolhida (anexo A, seção 7).",
    CIRCUNSTANCIA_INVALIDA: "Atenuante/agravante inválido.",
  };
  if (error instanceof Error && mensagens[error.message]) {
    return actionError(mensagens[error.message]);
  }
  if (isUniqueConstraintError(error)) {
    return actionError("Registro duplicado.");
  }
  return actionError("Não foi possível concluir a operação.");
}
