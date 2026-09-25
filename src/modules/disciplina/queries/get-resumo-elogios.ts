import "server-only";

import { prisma } from "@/db/prisma";

export type ResumoElogiosAluno = {
  quantidade: number;
  pontosTotais: number;
};

// Contagem e soma de pontos de elogio por aluno, agregados direto do ledger
// de elogios (nao persistido em coluna - mesmo padrao de get-resumo-pontuacao).
export async function getResumoElogios(
  colegioId: string,
  alunoIds: string[],
): Promise<Map<string, ResumoElogiosAluno>> {
  const mapa = new Map<string, ResumoElogiosAluno>();
  if (alunoIds.length === 0) {
    return mapa;
  }

  const grupos = await prisma.elogio.groupBy({
    by: ["alunoId"],
    where: { colegioId, alunoId: { in: alunoIds } },
    _sum: { valorPontos: true },
    _count: { _all: true },
  });

  const porAluno = new Map(
    grupos.map((g) => [g.alunoId, g] as const),
  );

  for (const alunoId of alunoIds) {
    const g = porAluno.get(alunoId);
    mapa.set(alunoId, {
      quantidade: g?._count._all ?? 0,
      pontosTotais: Number(g?._sum.valorPontos ?? 0),
    });
  }

  return mapa;
}
