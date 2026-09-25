import "server-only";

import { prisma } from "@/db/prisma";

// Fila da autoridade: reconsideracoes do colegio ativo, pendentes primeiro.
export async function listReconsideracoes(
  colegioId: string,
  apenasPendentes = true,
) {
  const reconsideracoes = await prisma.reconsideracao.findMany({
    where: {
      ocorrenciaAluno: { ocorrencia: { colegioId } },
      ...(apenasPendentes ? { status: "PENDENTE" } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      status: true,
      prazoFinal: true,
      numero: true,
      createdAt: true,
      solicitante: { select: { nome: true } },
      ocorrenciaAluno: {
        select: {
          numeroProcesso: true,
          ocorrenciaId: true,
          aluno: { select: { nome: true, matriculaGeral: true } },
        },
      },
      sancao: {
        select: {
          tipoSancaoCodigo: true,
          status: true,
          decisao: { select: { naturezaApurada: true } },
        },
      },
    },
  });

  return reconsideracoes;
}
