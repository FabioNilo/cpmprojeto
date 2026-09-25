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
  createPerfilSchema,
  togglePerfilSchema,
  updatePerfilSchema,
} from "../schemas/perfil-schema";
import {
  podeAlterarIdentidadeDoPerfil,
  podeGerenciarPerfil,
} from "../services/rbac-admin-rules";

export async function createPerfilAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RBAC_MANAGE);
  const parsed = createPerfilSchema.safeParse({
    codigo: formData.get("codigo"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados do perfil.");
  }

  try {
    const metadata = await getRequestMetadata();
    const perfil = await prisma.$transaction(async (tx) => {
      const created = await tx.perfil.create({
        data: {
          codigo: parsed.data.codigo,
          nome: parsed.data.nome,
          descricao: parsed.data.descricao,
          sistema: false,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CRIACAO_PERFIL",
          entidade: "perfis",
          entidadeId: String(created.id),
          dadosNovos: { codigo: created.codigo, nome: created.nome },
          metadata,
        },
        tx,
      );

      return created;
    });

    revalidatePath("/rbac");
    return actionSuccess(`Perfil ${perfil.codigo} criado.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe perfil com esse código.");
    }

    return actionError("Não foi possível criar o perfil.");
  }
}

export async function updatePerfilAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RBAC_MANAGE);
  const parsed = updatePerfilSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    descricao: formData.get("descricao"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados do perfil.");
  }

  try {
    const metadata = await getRequestMetadata();
    const perfil = await prisma.$transaction(async (tx) => {
      const previous = await tx.perfil.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          codigo: true,
          nome: true,
          descricao: true,
          sistema: true,
        },
      });

      if (!previous) {
        throw new Error("PERFIL_NAO_ENCONTRADO");
      }

      if (!podeAlterarIdentidadeDoPerfil(previous)) {
        throw new Error("PERFIL_SISTEMA_PROTEGIDO");
      }

      if (!podeGerenciarPerfil(previous, context.perfis)) {
        throw new Error("PERFIL_SEM_ALCADA");
      }

      const updated = await tx.perfil.update({
        where: { id: previous.id },
        data: { nome: parsed.data.nome, descricao: parsed.data.descricao },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_PERFIL",
          entidade: "perfis",
          entidadeId: String(updated.id),
          dadosAnteriores: {
            nome: previous.nome,
            descricao: previous.descricao,
          },
          dadosNovos: { nome: updated.nome, descricao: updated.descricao },
          metadata,
        },
        tx,
      );

      return updated;
    });

    revalidatePath("/rbac");
    return actionSuccess(`Perfil ${perfil.codigo} atualizado.`);
  } catch (error) {
    if (error instanceof Error && error.message === "PERFIL_NAO_ENCONTRADO") {
      return actionError("Perfil nao encontrado.");
    }

    if (
      error instanceof Error &&
      error.message === "PERFIL_SISTEMA_PROTEGIDO"
    ) {
      return actionError("Perfis de sistema nao podem ser renomeados.");
    }

    if (error instanceof Error && error.message === "PERFIL_SEM_ALCADA") {
      return actionError("Você não tem alçada sobre esse perfil.");
    }

    return actionError("Não foi possível atualizar o perfil.");
  }
}

export async function togglePerfilAction(formData: FormData): Promise<void> {
  const context = await requirePermission(PERMISSIONS.RBAC_MANAGE);
  const parsed = togglePerfilSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success) {
    return;
  }

  const perfil = await prisma.perfil.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, codigo: true, sistema: true },
  });

  if (
    !perfil ||
    !podeAlterarIdentidadeDoPerfil(perfil) ||
    !podeGerenciarPerfil(perfil, context.perfis)
  ) {
    return;
  }

  await prisma.perfil.update({
    where: { id: perfil.id },
    data: { ativo: parsed.data.ativo },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_PERFIL",
    entidade: "perfis",
    entidadeId: String(perfil.id),
    dadosNovos: { ativo: parsed.data.ativo },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/rbac");
}
