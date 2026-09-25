"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/db/prisma";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { getCurrentSession } from "@/modules/auth/services/session-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import { switchTenantSchema } from "../schemas/switch-tenant-schema";

export async function switchTenantAction(formData: FormData): Promise<void> {
  const context = await requirePermission(PERMISSIONS.TENANCY_SWITCH);
  const session = await getCurrentSession();
  const parsed = switchTenantSchema.safeParse({
    colegioId: formData.get("colegioId"),
  });

  if (!session || !parsed.success) {
    return;
  }

  if (parsed.data.colegioId === session.colegioAtivoId) {
    return;
  }

  const targetVinculo = await prisma.usuarioColegio.findFirst({
    where: {
      usuarioId: session.usuarioId,
      colegioId: parsed.data.colegioId,
      ativo: true,
      colegio: {
        ativo: true,
      },
      perfis: {
        some: {
          perfil: {
            ativo: true,
            permissoes: {
              some: {
                permissao: {
                  codigo: PERMISSIONS.TENANCY_SWITCH,
                },
              },
            },
          },
        },
      },
    },
    select: {
      colegioId: true,
      colegio: {
        select: {
          nome: true,
        },
      },
    },
  });

  if (!targetVinculo) {
    await registerAudit({
      usuarioId: context.usuarioId,
      colegioId: context.colegioId,
      acao: "TROCA_COLEGIO_NEGADA",
      entidade: "colegios",
      entidadeId: parsed.data.colegioId,
      metadata: await getRequestMetadata(),
    });
    return;
  }

  const metadata = await getRequestMetadata();

  await prisma.$transaction(async (tx) => {
    await tx.sessao.update({
      where: { id: session.id },
      data: {
        colegioAtivoId: targetVinculo.colegioId,
      },
    });

    await registerAudit(
      {
        usuarioId: context.usuarioId,
        colegioId: targetVinculo.colegioId,
        acao: "TROCA_COLEGIO_ATIVO",
        entidade: "sessoes",
        entidadeId: session.id,
        dadosAnteriores: {
          colegioId: context.colegioId,
          colegioNome: context.colegioNome,
        },
        dadosNovos: {
          colegioId: targetVinculo.colegioId,
          colegioNome: targetVinculo.colegio.nome,
        },
        metadata,
      },
      tx,
    );
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
