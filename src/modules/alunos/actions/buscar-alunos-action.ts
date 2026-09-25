"use server";

import { PERMISSIONS } from "@/modules/rbac/permissions";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

import {
  listAlunosParaSelecao,
  type AlunoOpcao,
} from "../queries/search-alunos";

const PERMISSOES_PERMITIDAS = [
  PERMISSIONS.ALUNOS_READ,
  PERMISSIONS.OCORRENCIAS_CREATE,
  PERMISSIONS.MATRICULAS_MANAGE,
  PERMISSIONS.RESPONSAVEIS_MANAGE,
  PERMISSIONS.ALUNOS_TRANSFER,
];

export async function buscarAlunosParaSelecaoAction(input: {
  serie?: string;
  sala?: string;
  termo?: string;
}): Promise<AlunoOpcao[]> {
  const context = await getTenantContext();
  if (
    !PERMISSOES_PERMITIDAS.some((p) => context.permissoes.includes(p))
  ) {
    return [];
  }
  return listAlunosParaSelecao(context.colegioId, input, 80);
}
