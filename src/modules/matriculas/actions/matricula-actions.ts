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
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  cancelarMatriculaSchema,
  createMatriculaSchema,
  reativarMatriculaSchema,
  transferirTurmaMatriculaSchema,
} from "../schemas/matricula-schema";
import {
  avaliarMatricula,
  avaliarTransferenciaTurma,
} from "../services/matricula-rules";

const MOTIVO_MENSAGEM: Record<string, string> = {
  ALUNO_SEM_VINCULO_ATIVO: "O aluno não tem vínculo ativo no colégio ativo.",
  ANO_LETIVO_INATIVO: "O ano letivo da turma está encerrado.",
  TURMA_INATIVA: "A turma selecionada está inativa.",
  TURMA_DE_OUTRO_ANO: "A turma pertence a outro ano letivo.",
  TURMA_DE_OUTRO_COLEGIO: "A turma pertence a outro colégio.",
  MATRICULA_INATIVA: "A matrícula está cancelada. Reative-a antes de transferir.",
  MATRICULA_NAO_ENCONTRADA: "Matrícula não encontrada no colégio ativo.",
  TURMA_INVALIDA: "Turma inválida para o colégio ativo.",
  ALUNO_SEM_VINCULO: "O aluno não tem vínculo com o colégio ativo.",
  NAO_PODE_REATIVAR:
    "Não é possível reativar: vínculo do aluno inativo ou ano letivo encerrado.",
};

function mapErro(error: unknown): ActionState {
  if (error instanceof Error && MOTIVO_MENSAGEM[error.message]) {
    return actionError(MOTIVO_MENSAGEM[error.message]);
  }
  if (isUniqueConstraintError(error)) {
    return actionError("Já existe matrícula para esse aluno nesse ano letivo.");
  }
  return actionError("Não foi possível concluir a operação.");
}

export async function createMatriculaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.MATRICULAS_MANAGE);
  const parsed = createMatriculaSchema.safeParse({
    alunoId: formData.get("alunoId"),
    turmaId: formData.get("turmaId"),
    numero: formData.get("numero"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da matrícula.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const vinculo = await tx.alunoVinculoColegio.findFirst({
        where: { alunoId: parsed.data.alunoId, colegioId: context.colegioId },
        select: { id: true, status: true },
      });

      if (!vinculo) {
        throw new Error("ALUNO_SEM_VINCULO");
      }

      const turma = await tx.turma.findFirst({
        where: { id: parsed.data.turmaId, colegioId: context.colegioId },
        select: {
          id: true,
          colegioId: true,
          anoLetivoId: true,
          ativa: true,
          anoLetivo: { select: { ano: true, ativo: true } },
        },
      });

      if (!turma) {
        throw new Error("TURMA_INVALIDA");
      }

      const regra = avaliarMatricula({
        vinculoStatus: vinculo.status,
        anoLetivoAtivo: turma.anoLetivo.ativo,
        turmaAtiva: turma.ativa,
        turmaAnoLetivoId: turma.anoLetivoId,
        anoLetivoId: turma.anoLetivoId,
        turmaColegioId: turma.colegioId,
        colegioId: context.colegioId,
      });

      if (!regra.ok) {
        throw new Error(regra.motivo);
      }

      const registro = await tx.matricula.upsert({
        where: {
          alunoId_colegioId_anoLetivoId: {
            alunoId: parsed.data.alunoId,
            colegioId: context.colegioId,
            anoLetivoId: turma.anoLetivoId,
          },
        },
        update: {
          turmaId: turma.id,
          alunoVinculoColegioId: vinculo.id,
          numero: parsed.data.numero,
          ativa: true,
        },
        create: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          alunoVinculoColegioId: vinculo.id,
          turmaId: turma.id,
          anoLetivoId: turma.anoLetivoId,
          numero: parsed.data.numero,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CRIACAO_MATRICULA",
          entidade: "matriculas",
          entidadeId: registro.id,
          dadosNovos: {
            alunoId: parsed.data.alunoId,
            turmaId: turma.id,
            ano: turma.anoLetivo.ano,
          },
          metadata,
        },
        tx,
      );

      return registro;
    });

    revalidatePath("/matriculas");
    revalidatePath("/alunos");
    return actionSuccess("Matrícula registrada.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function transferirTurmaMatriculaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.MATRICULAS_MANAGE);
  const parsed = transferirTurmaMatriculaSchema.safeParse({
    id: formData.get("id"),
    turmaId: formData.get("turmaId"),
  });

  if (!parsed.success) {
    return actionError("Confira a turma de destino.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const matricula = await tx.matricula.findFirst({
        where: { id: parsed.data.id, colegioId: context.colegioId },
        select: {
          id: true,
          ativa: true,
          anoLetivoId: true,
          turma: { select: { nome: true } },
        },
      });

      if (!matricula) {
        throw new Error("MATRICULA_NAO_ENCONTRADA");
      }

      const turma = await tx.turma.findFirst({
        where: { id: parsed.data.turmaId, colegioId: context.colegioId },
        select: {
          id: true,
          nome: true,
          ativa: true,
          colegioId: true,
          anoLetivoId: true,
        },
      });

      if (!turma) {
        throw new Error("TURMA_INVALIDA");
      }

      const regra = avaliarTransferenciaTurma({
        matriculaAtiva: matricula.ativa,
        turmaAtiva: turma.ativa,
        turmaAnoLetivoId: turma.anoLetivoId,
        matriculaAnoLetivoId: matricula.anoLetivoId,
        turmaColegioId: turma.colegioId,
        colegioId: context.colegioId,
      });

      if (!regra.ok) {
        throw new Error(regra.motivo);
      }

      await tx.matricula.update({
        where: { id: matricula.id },
        data: { turmaId: turma.id },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "TRANSFERENCIA_TURMA",
          entidade: "matriculas",
          entidadeId: matricula.id,
          dadosAnteriores: { turma: matricula.turma.nome },
          dadosNovos: { turma: turma.nome },
          metadata,
        },
        tx,
      );
    });

    revalidatePath("/matriculas");
    return actionSuccess("Aluno transferido de turma.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function cancelarMatriculaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.MATRICULAS_MANAGE);
  const parsed = cancelarMatriculaSchema.safeParse({
    id: formData.get("id"),
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados do cancelamento.");
  }

  const matricula = await prisma.matricula.findFirst({
    where: { id: parsed.data.id, colegioId: context.colegioId },
    select: { id: true },
  });

  if (!matricula) {
    return actionError("Matrícula não encontrada no colégio ativo.");
  }

  await prisma.matricula.update({
    where: { id: matricula.id },
    data: { ativa: false },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "CANCELAMENTO_MATRICULA",
    entidade: "matriculas",
    entidadeId: matricula.id,
    dadosNovos: { ativa: false, motivo: parsed.data.motivo ?? null },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/matriculas");
  return actionSuccess("Matrícula cancelada.");
}

export async function reativarMatriculaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.MATRICULAS_MANAGE);
  const parsed = reativarMatriculaSchema.safeParse({ id: formData.get("id") });

  if (!parsed.success) {
    return actionError("Matrícula inválida.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const matricula = await tx.matricula.findFirst({
        where: { id: parsed.data.id, colegioId: context.colegioId },
        select: {
          id: true,
          anoLetivo: { select: { ativo: true } },
          alunoVinculoColegio: { select: { status: true } },
        },
      });

      if (!matricula) {
        throw new Error("MATRICULA_NAO_ENCONTRADA");
      }

      if (
        !matricula.anoLetivo.ativo ||
        matricula.alunoVinculoColegio.status !== "ATIVO"
      ) {
        throw new Error("NAO_PODE_REATIVAR");
      }

      await tx.matricula.update({
        where: { id: matricula.id },
        data: { ativa: true },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_MATRICULA",
          entidade: "matriculas",
          entidadeId: matricula.id,
          dadosNovos: { ativa: true },
          metadata,
        },
        tx,
      );
    });

    revalidatePath("/matriculas");
    return actionSuccess("Matrícula reativada.");
  } catch (error) {
    return mapErro(error);
  }
}
