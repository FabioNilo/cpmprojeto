"use server";

import { redirect } from "next/navigation";

import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import {
  destroyCurrentSession,
  getCurrentSession,
} from "@/modules/auth/services/session-service";

export async function logoutAction(): Promise<void> {
  const session = await getCurrentSession();

  if (session) {
    await registerAudit({
      usuarioId: session.usuarioId,
      colegioId: session.colegioAtivoId,
      acao: "LOGOUT",
      entidade: "sessoes",
      entidadeId: session.id,
      metadata: await getRequestMetadata(),
    });
  }

  await destroyCurrentSession();
  redirect("/login");
}
