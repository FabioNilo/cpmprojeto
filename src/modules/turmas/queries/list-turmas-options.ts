import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/db/prisma";

// Turmas mudam raramente (matricula/ano letivo). Cache de 15 dias, invalidado
// na hora por revalidateTag("turmas") em qualquer criacao/edicao/inativacao
// de turma (turma-actions.ts) - reduz egress do Supabase sem deixar a lista
// desatualizada apos uma mudanca real.
const QUINZE_DIAS = 60 * 60 * 24 * 15;

export const listTurmasAtivasOptions = unstable_cache(
  async (colegioId: string) => buscarTurmasAtivasOptions(colegioId),
  ["turmas-ativas-options"],
  { tags: ["turmas"], revalidate: QUINZE_DIAS },
);

async function buscarTurmasAtivasOptions(colegioId: string) {
  return prisma.turma.findMany({
    where: {
      colegioId,
      ativa: true,
      anoLetivo: {
        ativo: true,
      },
    },
    orderBy: [{ anoLetivo: { ano: "desc" } }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      anoLetivo: {
        select: {
          ano: true,
        },
      },
    },
  });
}

export const listTurmasAtivasTransferOptions = unstable_cache(
  async (origemColegioId: string) =>
    buscarTurmasAtivasTransferOptions(origemColegioId),
  ["turmas-ativas-transfer-options"],
  { tags: ["turmas"], revalidate: QUINZE_DIAS },
);

async function buscarTurmasAtivasTransferOptions(origemColegioId: string) {
  return prisma.turma.findMany({
    where: {
      colegioId: {
        not: origemColegioId,
      },
      ativa: true,
      colegio: {
        ativo: true,
      },
      anoLetivo: {
        ativo: true,
      },
    },
    orderBy: [
      { colegio: { nome: "asc" } },
      { anoLetivo: { ano: "desc" } },
      { nome: "asc" },
    ],
    select: {
      id: true,
      nome: true,
      colegioId: true,
      colegio: {
        select: {
          codigo: true,
        },
      },
      anoLetivo: {
        select: {
          ano: true,
        },
      },
    },
  });
}
