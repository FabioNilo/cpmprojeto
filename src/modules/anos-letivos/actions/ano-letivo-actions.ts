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
  createAnoLetivoSchema,
  toggleAnoLetivoSchema,
} from "../schemas/ano-letivo-schema";

export async function createAnoLetivoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ANOS_LETIVOS_MANAGE);
  const parsed = createAnoLetivoSchema.safeParse({ ano: formData.get("ano") });

  if (!parsed.success) {
    return actionError("Informe um ano letivo valido.");
  }

  try {
    const metadata = await getRequestMetadata();
    const anoLetivo = await prisma.$transaction(async (tx) => {
      const existente = await tx.anoLetivo.findUnique({
        where: {
          colegioId_ano: {
            colegioId: context.colegioId,
            ano: parsed.data.ano,
          },
        },
        select: { id: true, ativo: true },
      });

      const registro = await tx.anoLetivo.upsert({
        where: {
          colegioId_ano: {
            colegioId: context.colegioId,
            ano: parsed.data.ano,
          },
        },
        update: { ativo: true },
        create: { colegioId: context.colegioId, ano: parsed.data.ano },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: existente ? "ALTERACAO_ANO_LETIVO" : "CRIACAO_ANO_LETIVO",
          entidade: "anos_letivos",
          entidadeId: registro.id,
          dadosNovos: { ano: registro.ano, ativo: true },
          metadata,
        },
        tx,
      );

      return registro;
    });

    revalidatePath("/anos-letivos");
    return actionSuccess(`Ano letivo ${anoLetivo.ano} disponivel.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Esse ano letivo ja existe no colegio ativo.");
    }

    return actionError("Não foi possível abrir o ano letivo.");
  }
}

export async function toggleAnoLetivoAction(formData: FormData): Promise<void> {
  const context = await requirePermission(PERMISSIONS.ANOS_LETIVOS_MANAGE);
  const parsed = toggleAnoLetivoSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success) {
    return;
  }

  const anoLetivo = await prisma.anoLetivo.findFirst({
    where: { id: parsed.data.id, colegioId: context.colegioId },
    select: { id: true, ano: true },
  });

  if (!anoLetivo) {
    return;
  }

  await prisma.anoLetivo.update({
    where: { id: anoLetivo.id },
    data: { ativo: parsed.data.ativo },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_ANO_LETIVO",
    entidade: "anos_letivos",
    entidadeId: anoLetivo.id,
    dadosNovos: { ano: anoLetivo.ano, ativo: parsed.data.ativo },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/anos-letivos");
}
