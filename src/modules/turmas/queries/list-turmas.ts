import "server-only";

import { prisma } from "@/db/prisma";

export async function listTurmasByColegio(colegioId: string) {
  return prisma.turma.findMany({
    where: { colegioId },
    orderBy: [{ anoLetivo: { ano: "desc" } }, { nome: "asc" }],
    take: 50,
    select: {
      id: true,
      nome: true,
      turno: true,
      ativa: true,
      anoLetivo: {
        select: {
          ano: true,
        },
      },
      _count: {
        select: {
          matriculas: true,
        },
      },
    },
  });
}
