import "server-only";

import { prisma } from "@/db/prisma";

export async function listAnosLetivos(colegioId: string) {
  return prisma.anoLetivo.findMany({
    where: { colegioId },
    orderBy: { ano: "desc" },
    select: {
      id: true,
      ano: true,
      ativo: true,
      _count: {
        select: { turmas: true, matriculas: true },
      },
    },
  });
}
