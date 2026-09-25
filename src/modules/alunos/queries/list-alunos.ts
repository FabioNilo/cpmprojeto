import "server-only";

import { prisma } from "@/db/prisma";

export async function listAlunosByColegio(colegioId: string) {
  return prisma.aluno.findMany({
    where: {
      vinculosColegio: {
        some: {
          colegioId,
        },
      },
    },
    orderBy: { nome: "asc" },
    take: 50,
    select: {
      id: true,
      nome: true,
      matriculaGeral: true,
      ativo: true,
      vinculosColegio: {
        where: { colegioId },
        select: {
          id: true,
          status: true,
          dataEntrada: true,
          dataSaida: true,
        },
      },
      responsaveis: {
        select: {
          responsavel: {
            select: {
              usuario: {
                select: {
                  nome: true,
                },
              },
            },
          },
        },
      },
      matriculas: {
        where: { colegioId, ativa: true },
        select: {
          turma: {
            select: {
              nome: true,
            },
          },
          anoLetivo: {
            select: {
              ano: true,
            },
          },
        },
      },
    },
  });
}
