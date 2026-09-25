import "server-only";

import { prisma } from "@/db/prisma";

export async function listAlunosOptionsByColegio(colegioId: string) {
  return prisma.aluno.findMany({
    where: {
      vinculosColegio: {
        some: {
          colegioId,
          status: "ATIVO",
        },
      },
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      matriculaGeral: true,
    },
    take: 100,
  });
}
