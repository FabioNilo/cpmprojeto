import "server-only";

import { prisma } from "@/db/prisma";

import { resumoPontuacao } from "../services/pontuacao";

export type ResumoPontuacaoAluno = {
  saldoBruto: number;
  saldoExibido: number;
  exigeAcompanhamento: boolean;
  totalMovimentos: number;
};

// Saldo/faixa de cada aluno reconstruido a partir do ledger imutavel
// (anexoA secoes 8 e 15). O valor nunca e persistido como coluna.
export async function getResumoPontuacao(
  colegioId: string,
  alunoIds: string[],
): Promise<Map<string, ResumoPontuacaoAluno>> {
  const mapa = new Map<string, ResumoPontuacaoAluno>();
  if (alunoIds.length === 0) {
    return mapa;
  }

  const grupos = await prisma.movimentoPontuacao.groupBy({
    by: ["alunoId"],
    where: { colegioId, alunoId: { in: alunoIds } },
    _sum: { valor: true },
    _count: { _all: true },
  });

  const porAluno = new Map(
    grupos.map((g) => [
      g.alunoId,
      { soma: Number(g._sum.valor ?? 0), total: g._count._all },
    ]),
  );

  for (const alunoId of alunoIds) {
    const info = porAluno.get(alunoId) ?? { soma: 0, total: 0 };
    const resumo = resumoPontuacao([{ valor: info.soma }]);
    mapa.set(alunoId, {
      saldoBruto: resumo.saldoBruto,
      saldoExibido: resumo.saldoExibido,
      exigeAcompanhamento: resumo.exigeAcompanhamento,
      totalMovimentos: info.total,
    });
  }

  return mapa;
}
