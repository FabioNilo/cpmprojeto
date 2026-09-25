import "server-only";

import { prisma } from "@/db/prisma";

export async function listPermissoes() {
  return prisma.permissao.findMany({
    orderBy: { codigo: "asc" },
    select: {
      id: true,
      codigo: true,
      nome: true,
      descricao: true,
    },
  });
}
