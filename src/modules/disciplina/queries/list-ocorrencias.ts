import "server-only";

import { prisma } from "@/db/prisma";

type Escopo = "OWN" | "SCHOOL";

export async function listOcorrencias(
  colegioId: string,
  input: { escopo: Escopo; usuarioId: string },
) {
  return prisma.ocorrencia.findMany({
    where: {
      colegioId,
      ...(input.escopo === "OWN" ? { comunicanteId: input.usuarioId } : {}),
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
