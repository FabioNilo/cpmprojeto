import "server-only";

import { prisma } from "@/db/prisma";

import type { StatusOcorrencia } from "../constants";

type Escopo = "OWN" | "SCHOOL";

export async function listOcorrencias(
  colegioId: string,
  input: {
    escopo: Escopo;
    usuarioId: string;
    status?: StatusOcorrencia;
    dataInicio?: Date;
    dataFimExclusivo?: Date;
  },
) {
  return prisma.ocorrencia.findMany({
    where: {
      colegioId,
      ...(input.escopo === "OWN" ? { comunicanteId: input.usuarioId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.dataInicio && input.dataFimExclusivo
        ? {
            dataOcorrencia: {
              gte: input.dataInicio,
              lt: input.dataFimExclusivo,
            },
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      numero: true,
      tipo: true,
      status: true,
      dataOcorrencia: true,
      sigiloso: true,
      createdAt: true,
      comunicante: { select: { nome: true } },
      _count: { select: { alunos: true } },
      alunos: {
        select: { aluno: { select: { nome: true } } },
        orderBy: { ordem: "asc" },
        take: 5,
      },
    },
  });
}
