"use server";

import { revalidatePath, revalidateTag } from "next/cache";

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
  createTurmaSchema,
  toggleTurmaSchema,
  updateTurmaSchema,
} from "../schemas/turma-schema";

export async function createTurmaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.TURMAS_MANAGE);
  const parsed = createTurmaSchema.safeParse({
    ano: formData.get("ano"),
    nome: formData.get("nome"),
    turno: formData.get("turno"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da turma.");
  }

  try {
    const metadata = await getRequestMetadata();
    const turma = await prisma.$transaction(async (tx) => {
      const anoLetivo = await tx.anoLetivo.upsert({
        where: {
          colegioId_ano: {
            colegioId: context.colegioId,
            ano: parsed.data.ano,
          },
        },
        update: { ativo: true },
        create: {
          colegioId: context.colegioId,
          ano: parsed.data.ano,
        },
      });

      const created = await tx.turma.create({
        data: {
          colegioId: context.colegioId,
          anoLetivoId: anoLetivo.id,
          nome: parsed.data.nome,
          turno: parsed.data.turno,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CRIACAO_TURMA",
          entidade: "turmas",
          entidadeId: created.id,
          dadosNovos: {
            nome: created.nome,
            ano: parsed.data.ano,
          },
          metadata,
        },
        tx,
      );

      return created;
    });

    revalidatePath("/turmas");
    revalidateTag("turmas");
    return actionSuccess(`Turma ${turma.nome} criada.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe turma com esse nome no ano letivo.");
    }

    return actionError("Não foi possível criar a turma.");
  }
}

export async function toggleTurmaAction(formData: FormData): Promise<void> {
  const context = await requirePermission(PERMISSIONS.TURMAS_MANAGE);
  const parsed = toggleTurmaSchema.safeParse({
    id: formData.get("id"),
    ativa: formData.get("ativa"),
  });

  if (!parsed.success) {
    return;
  }

  const turma = await prisma.turma.update({
    where: {
      id: parsed.data.id,
      colegioId: context.colegioId,
    },
    data: { ativa: parsed.data.ativa },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_TURMA",
    entidade: "turmas",
    entidadeId: turma.id,
    dadosNovos: {
      ativa: turma.ativa,
    },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/turmas");
  revalidateTag("turmas");
}

export async function updateTurmaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.TURMAS_MANAGE);
  const parsed = updateTurmaSchema.safeParse({
    id: formData.get("id"),
    ano: formData.get("ano"),
    nome: formData.get("nome"),
    turno: formData.get("turno"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da turma.");
  }

  try {
    const metadata = await getRequestMetadata();
    const turma = await prisma.$transaction(async (tx) => {
      const previous = await tx.turma.findFirst({
        where: {
          id: parsed.data.id,
          colegioId: context.colegioId,
        },
        select: {
          id: true,
          nome: true,
          turno: true,
          anoLetivo: {
            select: {
              ano: true,
            },
          },
        },
      });

      if (!previous) {
        throw new Error("TURMA_NAO_ENCONTRADA");
      }

      const anoLetivo = await tx.anoLetivo.upsert({
        where: {
          colegioId_ano: {
            colegioId: context.colegioId,
            ano: parsed.data.ano,
          },
        },
        update: { ativo: true },
        create: {
          colegioId: context.colegioId,
          ano: parsed.data.ano,
        },
      });

      const updated = await tx.turma.update({
        where: {
          id: previous.id,
        },
        data: {
          anoLetivoId: anoLetivo.id,
          nome: parsed.data.nome,
          turno: parsed.data.turno,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_TURMA",
          entidade: "turmas",
          entidadeId: updated.id,
          dadosAnteriores: {
            nome: previous.nome,
            turno: previous.turno,
            ano: previous.anoLetivo.ano,
          },
          dadosNovos: {
            nome: updated.nome,
            turno: updated.turno,
            ano: parsed.data.ano,
          },
          metadata,
        },
        tx,
      );

      return updated;
    });

    revalidatePath("/turmas");
    revalidateTag("turmas");
    revalidatePath("/alunos");
    return actionSuccess(`Turma ${turma.nome} atualizada.`);
  } catch (error) {
    if (error instanceof Error && error.message === "TURMA_NAO_ENCONTRADA") {
      return actionError("Turma nao encontrada no colegio ativo.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe turma com esse nome no ano letivo.");
    }

    return actionError("Não foi possível atualizar a turma.");
  }
}
