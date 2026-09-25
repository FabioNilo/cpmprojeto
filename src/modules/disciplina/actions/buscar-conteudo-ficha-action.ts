"use server";

import { getConteudoFicha } from "../queries/get-ficha";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

// So busca o snapshot completo da FAD quando o usuario realmente pede (botao
// "Ver conteudo"), nunca na renderizacao normal da pagina - ver
// get-ficha.ts (getFichaAtual x getConteudoFicha) pro motivo.
export async function buscarConteudoFichaAction(
  fichaId: string,
): Promise<{ conteudo: unknown } | { erro: string }> {
  const context = await requirePermission(PERMISSIONS.COMPORTAMENTO_READ);
  const ficha = await getConteudoFicha(fichaId, context.colegioId);
  if (!ficha) {
    return { erro: "Ficha não encontrada." };
  }
  return { conteudo: ficha.conteudo };
}
