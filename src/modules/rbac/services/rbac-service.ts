import "server-only";

import { notFound } from "next/navigation";

import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

export async function requirePermission(permission: string) {
  const context = await getTenantContext();

  if (!context.permissoes.includes(permission)) {
    await registerAudit({
      usuarioId: context.usuarioId,
      colegioId: context.colegioId,
      acao: "ACESSO_NEGADO",
      entidade: "permissao",
      entidadeId: permission,
      metadata: await getRequestMetadata(),
    });
    notFound();
  }

  return context;
}

export async function requireAnyPermission(permissions: string[]) {
  const context = await getTenantContext();

  if (!permissions.some((permission) => context.permissoes.includes(permission))) {
    await registerAudit({
      usuarioId: context.usuarioId,
      colegioId: context.colegioId,
      acao: "ACESSO_NEGADO",
      entidade: "permissao",
      entidadeId: permissions.join("|"),
      metadata: await getRequestMetadata(),
    });
    notFound();
  }

  return context;
}
