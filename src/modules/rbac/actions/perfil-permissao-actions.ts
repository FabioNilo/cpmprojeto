"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import { setPerfilPermissoesSchema } from "../schemas/perfil-schema";
import { podeEditarPermissoesDoPerfil } from "../services/rbac-admin-rules";

export async function setPerfilPermissoesAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RBAC_MANAGE);
  const parsed = setPerfilPermissoesSchema.safeParse({
    perfilId: formData.get("perfilId"),
    permissoes: formData.getAll("permissoes"),
  });

  if (!parsed.success) {
    return actionError("Confira as permissões selecionadas.");
  }

  try {
    const metadata = await getRequestMetadata();
    const perfil = await prisma.$transaction(async (tx) => {
      const alvo = await tx.perfil.findUnique({
        where: { id: parsed.data.perfilId },
        select: {
          id: true,
          codigo: true,
          sistema: true,
          permissoes: {
            select: { permissao: { select: { codigo: true } } },
          },
        },
      });

      if (!alvo) {
        throw new Error("PERFIL_NAO_ENCONTRADO");
      }

      if (!podeEditarPermissoesDoPerfil(alvo, context.perfis)) {
        throw new Error("PERFIL_PROTEGIDO");
      }

      const permissoesAlvo = await tx.permissao.findMany({
        where: { codigo: { in: parsed.data.permissoes } },
        select: { id: true, codigo: true },
      });
      const idsAlvo = permissoesAlvo.map((permissao) => permissao.id);
      const anteriores = alvo.permissoes
        .map((item) => item.permissao.codigo)
        .sort();

      await tx.perfilPermissao.deleteMany({
        where: { perfilId: alvo.id, permissaoId: { notIn: idsAlvo } },
      });

      for (const permissao of permissoesAlvo) {
        await tx.perfilPermissao.upsert({
          where: {
            perfilId_permissaoId: {
              perfilId: alvo.id,
              permissaoId: permissao.id,
            },
          },
          update: {},
          create: { perfilId: alvo.id, permissaoId: permissao.id },
        });
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_PERFIL_PERMISSAO",
          entidade: "perfis",
          entidadeId: String(alvo.id),
          dadosAnteriores: { permissoes: anteriores },
          dadosNovos: {
            permissoes: permissoesAlvo
              .map((permissao) => permissao.codigo)
              .sort(),
          },
          metadata,
        },
        tx,
      );

      return alvo;
    });

    revalidatePath("/rbac");
    return actionSuccess(`Permissões do perfil ${perfil.codigo} atualizadas.`);
  } catch (error) {
    if (error instanceof Error && error.message === "PERFIL_NAO_ENCONTRADO") {
      return actionError("Perfil não encontrado.");
    }

    if (error instanceof Error && error.message === "PERFIL_PROTEGIDO") {
      return actionError(
        "As permissões desse perfil não podem ser alteradas por aqui.",
      );
    }

    return actionError("Não foi possível atualizar as permissões.");
  }
}
