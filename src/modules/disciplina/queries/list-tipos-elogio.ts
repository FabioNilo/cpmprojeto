import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/db/prisma";

// Catalogo de tipos de elogio muda raramente. Cache de 15 dias, invalidado
// na hora por revalidateTag("tipos-elogio") em catalogo-actions.ts.
const QUINZE_DIAS = 60 * 60 * 24 * 15;

export const listTiposElogio = unstable_cache(
  buscarTiposElogio,
  ["tipos-elogio"],
  { tags: ["tipos-elogio"], revalidate: QUINZE_DIAS },
);

async function buscarTiposElogio() {
  const tipos = await prisma.tipoElogio.findMany({
    where: { ativo: true },
    orderBy: { codigo: "asc" },
    select: { codigo: true, nome: true, valorPontos: true },
  });
  return tipos.map((t) => ({
    codigo: t.codigo,
    nome: t.nome,
    valorPontos: Number(t.valorPontos),
  }));
}
