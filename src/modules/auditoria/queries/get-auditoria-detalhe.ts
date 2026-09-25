import "server-only";

import { prisma } from "@/db/prisma";

export async function getAuditoriaDetalhe(id: string, colegioId: string) {
  return prisma.auditoria.findFirst({
    where: {
      id,
      OR: [{ colegioId }, { colegioId: null }],
    },
    select: {
      id: true,
      acao: true,
      entidade: true,
      entidadeId: true,
      ip: true,
      userAgent: true,
      dataHora: true,
      dadosAnteriores: true,
      dadosNovos: true,
      usuario: {
        select: {
          id: true,
          nome: true,
        },
      },
      colegio: {
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      },
    },
  });
}
