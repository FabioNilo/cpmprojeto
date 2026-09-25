"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { construirNotificacaoComunicacao } from "@/modules/notificacoes/services/notificacao-rules";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import {
  requireAnyPermission,
  requirePermission,
} from "@/modules/rbac/services/rbac-service";
import type { TenantContext } from "@/modules/tenancy/services/tenant-context";

import {
  arquivarOcorrenciaSchema,
  createOcorrenciaSchema,
  ocorrenciaIdSchema,
  updateOcorrenciaSchema,
} from "../schemas/ocorrencia-schemas";
import {
  formatarNumeroOcorrencia,
  podeArquivarOcorrencia,
  podeEditarOcorrencia,
  podeEnviarOcorrencia,
  podeIniciarAveriguacao,
} from "../services/ocorrencia-rules";
import { proximoNumero } from "../services/numeracao-service";

const CAMINHO = "/disciplina/ocorrencias";

function podeGerir(
  context: TenantContext,
  ocorrencia: { comunicanteId: string },
): boolean {
  return (
    context.permissoes.includes(PERMISSIONS.OCORRENCIAS_MANAGE) ||
    ocorrencia.comunicanteId === context.usuarioId
  );
}

export async function createOcorrenciaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.OCORRENCIAS_CREATE);
  const parsed = createOcorrenciaSchema.safeParse({
    tipo: formData.get("tipo"),
    dataOcorrencia: formData.get("dataOcorrencia"),
    local: formData.get("local"),
    materia: formData.get("materia"),
    motivoSugeridoId: formData.get("motivoSugeridoId"),
    descricao: formData.get("descricao"),
    sigiloso: formData.get("sigiloso") ?? undefined,
    alunoIds: formData.getAll("alunoIds"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da comunicação.");
  }

  const alunoIds = [...new Set(parsed.data.alunoIds)];

  const vinculos = await prisma.alunoVinculoColegio.findMany({
    where: { colegioId: context.colegioId, alunoId: { in: alunoIds } },
    select: { alunoId: true },
  });

  if (vinculos.length !== alunoIds.length) {
    return actionError("Há aluno sem vínculo com o colégio ativo.");
  }

  let novaId = "";
  try {
    const metadata = await getRequestMetadata();

    // A sugestao de motivo e so uma dica pro comunicante - nunca deve
    // bloquear o registro do fato. Se o id vier de um item desativado (ou
    // inexistente), grava null em silencio.
    let motivoSugeridoId: string | null = null;
    if (parsed.data.motivoSugeridoId) {
      const motivo = await prisma.transgressao.findFirst({
        where: { id: parsed.data.motivoSugeridoId, ativo: true },
        select: { id: true },
      });
      motivoSugeridoId = motivo?.id ?? null;
    }

    novaId = await prisma.$transaction(async (tx) => {
      const ocorrencia = await tx.ocorrencia.create({
        data: {
          colegioId: context.colegioId,
          comunicanteId: context.usuarioId,
          tipo: parsed.data.tipo,
          dataOcorrencia: parsed.data.dataOcorrencia,
          local: parsed.data.local,
          materia: parsed.data.materia,
          motivoSugeridoId,
          descricao: parsed.data.descricao,
          sigiloso: parsed.data.sigiloso,
          alunos: {
            create: alunoIds.map((alunoId, indice) => ({
              alunoId,
              ordem: indice + 1,
            })),
          },
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CRIACAO_OCORRENCIA",
          entidade: "ocorrencias",
          entidadeId: ocorrencia.id,
          dadosNovos: {
            tipo: ocorrencia.tipo,
            alunos: alunoIds.length,
            motivoSugeridoId,
          },
          metadata,
        },
        tx,
      );

      return ocorrencia.id;
    });
  } catch {
    return actionError("Não foi possível registrar a comunicação.");
  }

  redirect(`${CAMINHO}/${novaId}`);
}

export async function updateOcorrenciaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_CREATE,
    PERMISSIONS.OCORRENCIAS_MANAGE,
  ]);
  const parsed = updateOcorrenciaSchema.safeParse({
    id: formData.get("id"),
    tipo: formData.get("tipo"),
    dataOcorrencia: formData.get("dataOcorrencia"),
    local: formData.get("local"),
    materia: formData.get("materia"),
    descricao: formData.get("descricao"),
    sigiloso: formData.get("sigiloso") ?? undefined,
  });

  if (!parsed.success) {
    return actionError("Confira os dados da comunicação.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const atual = await tx.ocorrencia.findFirst({
        where: { id: parsed.data.id, colegioId: context.colegioId },
        select: {
          id: true,
          status: true,
          comunicanteId: true,
          tipo: true,
          descricao: true,
        },
      });

      if (!atual) {
        throw new Error("OCORRENCIA_NAO_ENCONTRADA");
      }
      if (!podeGerir(context, atual)) {
        throw new Error("SEM_ALCADA");
      }
      if (!podeEditarOcorrencia(atual.status)) {
        throw new Error("STATUS_NAO_EDITAVEL");
      }

      const atualizada = await tx.ocorrencia.update({
        where: { id: atual.id },
        data: {
          tipo: parsed.data.tipo,
          dataOcorrencia: parsed.data.dataOcorrencia,
          local: parsed.data.local,
          materia: parsed.data.materia,
          descricao: parsed.data.descricao,
          sigiloso: parsed.data.sigiloso,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_OCORRENCIA",
          entidade: "ocorrencias",
          entidadeId: atual.id,
          dadosAnteriores: { tipo: atual.tipo, descricao: atual.descricao },
          dadosNovos: {
            tipo: atualizada.tipo,
            descricao: atualizada.descricao,
          },
          metadata,
        },
        tx,
      );
    });
  } catch (error) {
    return mapErro(error);
  }

  revalidatePath(`${CAMINHO}/${parsed.data.id}`);
  return actionSuccess("Comunicação atualizada.");
}

export async function enviarOcorrenciaAction(formData: FormData): Promise<void> {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_CREATE,
    PERMISSIONS.OCORRENCIAS_MANAGE,
  ]);
  const parsed = ocorrenciaIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return;
  }

  const metadata = await getRequestMetadata();
  await prisma.$transaction(async (tx) => {
    const ocorrencia = await tx.ocorrencia.findFirst({
      where: { id: parsed.data.id, colegioId: context.colegioId },
      select: {
        id: true,
        status: true,
        tipo: true,
        comunicanteId: true,
        dataOcorrencia: true,
        colegio: { select: { codigo: true } },
        alunos: {
          select: {
            id: true,
            ordem: true,
            aluno: {
              select: {
                nome: true,
                responsaveis: { select: { responsavelId: true } },
              },
            },
          },
        },
      },
    });

    if (
      !ocorrencia ||
      !podeGerir(context, ocorrencia) ||
      !podeEnviarOcorrencia(ocorrencia.status)
    ) {
      return;
    }

    const ano = new Date().getFullYear();
    const codigo = ocorrencia.colegio.codigo;

    // Cada aluno marcado gera um numero oficial INDEPENDENTE (a marcacao de
    // varios nomes e so um atalho de registro; a defesa de cada aluno corre
    // separada). Os numeros saem do contador atomico, um a um.
    const processosOrdenados = [...ocorrencia.alunos].sort(
      (a, b) => a.ordem - b.ordem,
    );
    let primeiroSeq: number | null = null;
    let primeiroNumero: string | null = null;
    const numerosGerados: string[] = [];
    const notificacoes: Prisma.NotificacaoResponsavelCreateManyInput[] = [];

    for (const processo of processosOrdenados) {
      const seq = await proximoNumero(tx, context.colegioId, "OCORRENCIA", ano);
      const numeroProcesso = formatarNumeroOcorrencia(codigo, ano, seq);
      await tx.ocorrenciaAluno.update({
        where: { id: processo.id },
        data: { numeroProcesso, numeroSequencial: seq, anoNumeracao: ano },
      });
      numerosGerados.push(numeroProcesso);
      if (primeiroSeq === null) {
        primeiroSeq = seq;
        primeiroNumero = numeroProcesso;
      }

      const { titulo, mensagem } = construirNotificacaoComunicacao({
        tipoOcorrencia: ocorrencia.tipo,
        numeroProcesso,
        alunoNome: processo.aluno.nome,
      });
      for (const { responsavelId } of processo.aluno.responsaveis) {
        notificacoes.push({
          responsavelId,
          colegioId: context.colegioId,
          tipo: "COMUNICACAO_DISCIPLINAR",
          ocorrenciaAlunoId: processo.id,
          titulo,
          mensagem,
        });
      }
    }

    await tx.ocorrencia.update({
      where: { id: ocorrencia.id },
      data: {
        status: "ENVIADA",
        sequencial: primeiroSeq,
        anoNumeracao: ano,
        numero: primeiroNumero,
        enviadaEm: new Date(),
      },
    });

    if (notificacoes.length > 0) {
      await tx.notificacaoResponsavel.createMany({ data: notificacoes });
    }

    await registerAudit(
      {
        usuarioId: context.usuarioId,
        colegioId: context.colegioId,
        acao: "ENVIO_OCORRENCIA",
        entidade: "ocorrencias",
        entidadeId: ocorrencia.id,
        dadosNovos: {
          numeros: numerosGerados,
          notificacoesGeradas: notificacoes.length,
        },
        metadata,
      },
      tx,
    );
  });

  revalidatePath(`${CAMINHO}/${parsed.data.id}`);
}

export async function iniciarAveriguacaoAction(
  formData: FormData,
): Promise<void> {
  const context = await requirePermission(PERMISSIONS.OCORRENCIAS_MANAGE);
  const parsed = ocorrenciaIdSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    return;
  }

  const ocorrencia = await prisma.ocorrencia.findFirst({
    where: { id: parsed.data.id, colegioId: context.colegioId },
    select: { id: true, status: true },
  });

  if (!ocorrencia || !podeIniciarAveriguacao(ocorrencia.status)) {
    return;
  }

  await prisma.ocorrencia.update({
    where: { id: ocorrencia.id },
    data: { status: "EM_AVERIGUACAO" },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "AVERIGUACAO_OCORRENCIA",
    entidade: "ocorrencias",
    entidadeId: ocorrencia.id,
    dadosNovos: { status: "EM_AVERIGUACAO" },
    metadata: await getRequestMetadata(),
  });

  revalidatePath(`${CAMINHO}/${parsed.data.id}`);
}

export async function arquivarOcorrenciaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.OCORRENCIAS_MANAGE);
  const parsed = arquivarOcorrenciaSchema.safeParse({
    id: formData.get("id"),
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return actionError("Informe o motivo do arquivamento.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const ocorrencia = await tx.ocorrencia.findFirst({
        where: { id: parsed.data.id, colegioId: context.colegioId },
        select: { id: true, status: true },
      });

      if (!ocorrencia) {
        throw new Error("OCORRENCIA_NAO_ENCONTRADA");
      }
      if (!podeArquivarOcorrencia(ocorrencia.status)) {
        throw new Error("STATUS_NAO_ARQUIVAVEL");
      }

      await tx.ocorrencia.update({
        where: { id: ocorrencia.id },
        data: {
          status: "ARQUIVADA",
          motivoArquivamento: parsed.data.motivo,
          encerradaEm: new Date(),
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ARQUIVAMENTO_OCORRENCIA",
          entidade: "ocorrencias",
          entidadeId: ocorrencia.id,
          dadosNovos: { motivo: parsed.data.motivo },
          metadata,
        },
        tx,
      );
    });
  } catch (error) {
    return mapErro(error);
  }

  revalidatePath(`${CAMINHO}/${parsed.data.id}`);
  return actionSuccess("Ocorrência arquivada.");
}

function mapErro(error: unknown): ActionState {
  const mensagens: Record<string, string> = {
    OCORRENCIA_NAO_ENCONTRADA: "Ocorrência não encontrada no colégio ativo.",
    SEM_ALCADA: "Você não pode alterar esta ocorrência.",
    STATUS_NAO_EDITAVEL: "A ocorrência não pode mais ser editada.",
    STATUS_NAO_ARQUIVAVEL: "A ocorrência não pode ser arquivada neste estado.",
  };
  if (error instanceof Error && mensagens[error.message]) {
    return actionError(mensagens[error.message]);
  }
  return actionError("Não foi possível concluir a operação.");
}
