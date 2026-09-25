import "server-only";

import { prisma } from "@/db/prisma";

// Catalogos ativos usados nos formularios de enquadramento e decisao (D4).
export async function listOpcoesAnalise() {
  const [transgressoes, atenuantes, agravantes, tiposSancao] = await Promise.all(
    [
      prisma.transgressao.findMany({
        where: { ativo: true },
        orderBy: [{ natureza: "asc" }, { codigo: "asc" }],
        select: { id: true, codigo: true, descricao: true, natureza: true },
      }),
      prisma.atenuante.findMany({
        where: { ativo: true },
        orderBy: { codigo: "asc" },
        select: { id: true, codigo: true, descricao: true },
      }),
      prisma.agravante.findMany({
        where: { ativo: true },
        orderBy: { codigo: "asc" },
        select: { id: true, codigo: true, descricao: true },
      }),
      prisma.tipoSancao.findMany({
        where: { ativo: true },
        orderBy: { ordem: "asc" },
        select: { codigo: true, nome: true, ordem: true },
      }),
    ],
  );

  return { transgressoes, atenuantes, agravantes, tiposSancao };
}

export type OpcoesAnalise = Awaited<ReturnType<typeof listOpcoesAnalise>>;
