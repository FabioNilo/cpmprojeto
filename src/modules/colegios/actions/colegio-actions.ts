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
  createColegioSchema,
  toggleColegioSchema,
  updateColegioSchema,
} from "../schemas/colegio-schema";

export async function createColegioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.COLEGIOS_MANAGE);
  const parsed = createColegioSchema.safeParse({
    nome: formData.get("nome"),
    codigo: formData.get("codigo"),
  });

  if (!parsed.success) {
    return actionError("Confira nome e codigo do colegio.");
  }

  try {
    const colegio = await prisma.colegio.create({
      data: parsed.data,
    });

    await registerAudit({
      usuarioId: context.usuarioId,
      colegioId: context.colegioId,
      acao: "CRIACAO_COLEGIO",
      entidade: "colegios",
      entidadeId: colegio.id,
      dadosNovos: {
        nome: colegio.nome,
        codigo: colegio.codigo,
      },
      metadata: await getRequestMetadata(),
    });

    revalidatePath("/colegios");
    return actionSuccess("Colégio criado.");
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe colégio com esse código.");
    }

    return actionError("Não foi possível criar o colégio.");
  }
}

export async function toggleColegioAction(formData: FormData): Promise<void> {
  const context = await requirePermission(PERMISSIONS.COLEGIOS_MANAGE);
  const parsed = toggleColegioSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success) {
    return;
  }

  const colegio = await prisma.colegio.update({
    where: { id: parsed.data.id },
    data: { ativo: parsed.data.ativo },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_COLEGIO",
    entidade: "colegios",
    entidadeId: colegio.id,
    dadosNovos: {
      ativo: colegio.ativo,
    },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/colegios");
}

export async function updateColegioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.COLEGIOS_MANAGE);
  const parsed = updateColegioSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    codigo: formData.get("codigo"),
  });

  if (!parsed.success) {
    return actionError("Confira nome e codigo do colegio.");
  }

  try {
    const metadata = await getRequestMetadata();
    const colegio = await prisma.$transaction(async (tx) => {
      const previous = await tx.colegio.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      });

      if (!previous) {
        throw new Error("COLEGIO_NAO_ENCONTRADO");
      }

      const updated = await tx.colegio.update({
        where: { id: previous.id },
        data: {
          nome: parsed.data.nome,
          codigo: parsed.data.codigo,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_COLEGIO",
          entidade: "colegios",
          entidadeId: updated.id,
          dadosAnteriores: previous,
          dadosNovos: {
            nome: updated.nome,
            codigo: updated.codigo,
          },
          metadata,
        },
        tx,
      );

      return updated;
    });

    revalidatePath("/colegios");
    return actionSuccess(`Colégio ${colegio.codigo} atualizado.`);
  } catch (error) {
    if (error instanceof Error && error.message === "COLEGIO_NAO_ENCONTRADO") {
      return actionError("Colégio não encontrado.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe colégio com esse código.");
    }

    return actionError("Não foi possível atualizar o colégio.");
  }
}
