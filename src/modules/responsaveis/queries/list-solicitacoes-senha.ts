import "server-only";

import { prisma } from "@/db/prisma";

export async function listSolicitacoesSenhaPendentes(colegioId: string) {
  return prisma.solicitacaoSenhaResponsavel.findMany({
    where: { colegioId, atendidaEm: null },
    orderBy: { criadoEm: "asc" },
    select: {
      id: true,
      criadoEm: true,
      usuario: {
        select: {
          nome: true,
          username: true,
          responsavel: {
            select: {
              telefone: true,
              alunos: {
                select: { aluno: { select: { nome: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export async function contarSolicitacoesSenhaPendentes(
  colegioId: string,
): Promise<number> {
  return prisma.solicitacaoSenhaResponsavel.count({
    where: { colegioId, atendidaEm: null },
  });
}
