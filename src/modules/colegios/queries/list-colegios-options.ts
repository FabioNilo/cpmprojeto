import "server-only";

import { prisma } from "@/db/prisma";

export async function listColegioTransferOptions(origemColegioId: string) {
  return prisma.colegio.findMany({
    where: {
      id: {
        not: origemColegioId,
      },
      ativo: true,
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      codigo: true,
      nome: true,
    },
  });
}
