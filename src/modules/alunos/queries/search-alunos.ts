import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";

export const ALUNOS_PAGE_SIZE = 25;

export type FiltroAlunos = {
  serie?: string;
  sala?: string;
  termo?: string;
  page?: number;
  // "ATIVO" (padrao) traz so quem tem vinculo ativo; "TODOS" ignora o status.
  status?: "ATIVO" | "TODOS";
  // exigirFiltro=true: sem serie/sala/termo nao busca nada (carga sob demanda).
  exigirFiltro?: boolean;
};

export type AlunoResultado = {
  id: string;
  nome: string;
  matriculaGeral: string | null;
  necessidadeEspecial: boolean;
  turma: string | null;
  vinculoId: string | null;
  vinculoStatus: "ATIVO" | "TRANSFERIDO" | "ENCERRADO" | null;
};

function turmaWhere(
  colegioId: string,
  serie?: string,
  sala?: string,
): Prisma.MatriculaListRelationFilter | undefined {
  const cond: Prisma.StringFilter[] = [];
  if (serie) cond.push({ startsWith: `${serie} ` });
  if (sala) cond.push({ endsWith: ` ${sala}` });
  if (cond.length === 0) return undefined;
  return {
    some: {
      colegioId,
      ativa: true,
      turma: { AND: cond.map((nome) => ({ nome })) },
    },
  };
}

export async function searchAlunos(
  colegioId: string,
  filtro: FiltroAlunos = {},
): Promise<{
  linhas: AlunoResultado[];
  total: number;
  page: number;
  totalPaginas: number;
  filtrou: boolean;
}> {
  const termo = filtro.termo?.trim() || undefined;
  const filtrou = Boolean(filtro.serie || filtro.sala || termo);
  const page = Math.max(1, filtro.page ?? 1);

  if (filtro.exigirFiltro && !filtrou) {
    return { linhas: [], total: 0, page: 1, totalPaginas: 0, filtrou: false };
  }

  const where: Prisma.AlunoWhereInput = {
    vinculosColegio: {
      some:
        filtro.status === "TODOS"
          ? { colegioId }
          : { colegioId, status: "ATIVO" },
    },
  };

  const matriculaFiltro = turmaWhere(colegioId, filtro.serie, filtro.sala);
  if (matriculaFiltro) {
    where.matriculas = matriculaFiltro;
  }
  if (termo) {
    where.OR = [
      { nome: { contains: termo, mode: "insensitive" } },
      { matriculaGeral: { contains: termo } },
    ];
  }

  const [total, alunos] = await Promise.all([
    prisma.aluno.count({ where }),
    prisma.aluno.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (page - 1) * ALUNOS_PAGE_SIZE,
      take: ALUNOS_PAGE_SIZE,
      select: {
        id: true,
        nome: true,
        matriculaGeral: true,
        necessidadeEspecial: true,
        vinculosColegio: {
          where: { colegioId },
          select: { id: true, status: true },
          take: 1,
        },
        matriculas: {
          where: { colegioId, ativa: true },
          select: { turma: { select: { nome: true } } },
          take: 1,
        },
      },
    }),
  ]);

  return {
    linhas: alunos.map((a) => ({
      id: a.id,
      nome: a.nome,
      matriculaGeral: a.matriculaGeral,
      necessidadeEspecial: a.necessidadeEspecial,
      turma: a.matriculas[0]?.turma.nome ?? null,
      vinculoId: a.vinculosColegio[0]?.id ?? null,
      vinculoStatus: a.vinculosColegio[0]?.status ?? null,
    })),
    total,
    page,
    totalPaginas: Math.max(1, Math.ceil(total / ALUNOS_PAGE_SIZE)),
    filtrou,
  };
}

// Opcoes de aluno para seletores (comunicacao, matricula, responsavel), sempre
// escopadas por turma/sala/nome para nao trazer o colegio inteiro.
export type AlunoOpcao = {
  id: string;
  nome: string;
  matriculaGeral: string | null;
  turma: string | null;
};

export async function listAlunosParaSelecao(
  colegioId: string,
  filtro: { serie?: string; sala?: string; termo?: string },
  limite = 60,
): Promise<AlunoOpcao[]> {
  const termo = filtro.termo?.trim() || undefined;
  if (!filtro.serie && !filtro.sala && !termo) {
    return [];
  }

  const where: Prisma.AlunoWhereInput = {
    vinculosColegio: { some: { colegioId, status: "ATIVO" } },
  };
  const matriculaFiltro = turmaWhere(colegioId, filtro.serie, filtro.sala);
  if (matriculaFiltro) {
    where.matriculas = matriculaFiltro;
  }
  if (termo) {
    where.OR = [
      { nome: { contains: termo, mode: "insensitive" } },
      { matriculaGeral: { contains: termo } },
    ];
  }

  const alunos = await prisma.aluno.findMany({
    where,
    orderBy: { nome: "asc" },
    take: limite,
    select: {
      id: true,
      nome: true,
      matriculaGeral: true,
      matriculas: {
        where: { colegioId, ativa: true },
        select: { turma: { select: { nome: true } } },
        take: 1,
      },
    },
  });

  return alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    matriculaGeral: a.matriculaGeral,
    turma: a.matriculas[0]?.turma.nome ?? null,
  }));
}
