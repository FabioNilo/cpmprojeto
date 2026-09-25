import "server-only";

import { prisma } from "@/db/prisma";

export async function listMatriculas(colegioId: string) {
  return prisma.matricula.findMany({
    where: { colegioId },
    orderBy: [
      { anoLetivo: { ano: "desc" } },
      { turma: { nome: "asc" } },
      { aluno: { nome: "asc" } },
    ],
    take: 200,
    select: {
      id: true,
      numero: true,
      ativa: true,
      aluno: {
        select: { id: true, nome: true, matriculaGeral: true },
      },
      turma: {
        select: { id: true, nome: true },
      },
      anoLetivo: {
        select: { id: true, ano: true },
      },
      alunoVinculoColegio: {
        select: { status: true },
      },
    },
  });
}
