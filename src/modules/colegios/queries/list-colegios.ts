import "server-only";

import { prisma } from "@/db/prisma";

export async function listColegios() {
  return prisma.colegio.findMany({
    orderBy: { nome: "asc" },
    take: 50,
    select: {
      id: true,
      nome: true,
      codigo: true,
      ativo: true,
      _count: {
        select: {
          usuarios: true,
          alunos: true,
          turmas: true,
        },
      },
    },
  });
}
