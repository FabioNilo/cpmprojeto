import "server-only";

import { prisma } from "@/db/prisma";

export async function listResponsaveisByColegio(colegioId: string) {
  return prisma.responsavel.findMany({
    where: {
      alunos: {
        some: {
          aluno: {
            vinculosColegio: {
              some: {
                colegioId,
              },
            },
          },
        },
      },
    },
    orderBy: {
      usuario: {
        nome: "asc",
      },
    },
    take: 50,
    select: {
      id: true,
      telefone: true,
      usuario: {
        select: {
          id: true,
          nome: true,
          username: true,
          email: true,
          cpf: true,
          colegios: {
            where: { colegioId },
            select: {
              ativo: true,
            },
          },
        },
      },
      alunos: {
        where: {
          aluno: {
            vinculosColegio: {
              some: {
                colegioId,
              },
            },
          },
        },
        select: {
          aluno: {
            select: {
              nome: true,
            },
          },
        },
      },
    },
  });
}
