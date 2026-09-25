import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";

import {
  AUDITORIA_PAGE_SIZE,
  type AuditoriaFilter,
} from "../schemas/auditoria-filter-schema";

const auditoriaListSelect = {
  id: true,
  acao: true,
  entidade: true,
  entidadeId: true,
  ip: true,
  dataHora: true,
  usuario: {
    select: {
      id: true,
      nome: true,
    },
  },
} as const;

function scopeWhere(colegioId: string): Prisma.AuditoriaWhereInput {
  return { OR: [{ colegioId }, { colegioId: null }] };
}

export function buildAuditoriaWhere(
  colegioId: string,
  filtros: AuditoriaFilter,
): Prisma.AuditoriaWhereInput {
  const where = scopeWhere(colegioId);

  if (filtros.acao) {
    where.acao = filtros.acao;
  }
  if (filtros.entidade) {
    where.entidade = filtros.entidade;
  }
  if (filtros.usuarioId) {
    where.usuarioId = filtros.usuarioId;
  }
  if (filtros.de || filtros.ate) {
    const dataHora: { gte?: Date; lte?: Date } = {};
    if (filtros.de) {
      dataHora.gte = new Date(`${filtros.de}T00:00:00`);
    }
    if (filtros.ate) {
      dataHora.lte = new Date(`${filtros.ate}T23:59:59.999`);
    }
    where.dataHora = dataHora;
  }

  return where;
}

export async function listAuditoria(
  colegioId: string,
  filtros: AuditoriaFilter,
) {
  const where = buildAuditoriaWhere(colegioId, filtros);
  const [total, registros] = await Promise.all([
    prisma.auditoria.count({ where }),
    prisma.auditoria.findMany({
      where,
      orderBy: { dataHora: "desc" },
      skip: (filtros.pagina - 1) * AUDITORIA_PAGE_SIZE,
      take: AUDITORIA_PAGE_SIZE,
      select: auditoriaListSelect,
    }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / AUDITORIA_PAGE_SIZE));

  return {
    registros,
    total,
    totalPaginas,
    pagina: Math.min(filtros.pagina, totalPaginas),
  };
}

export async function listAuditoriaParaExport(
  colegioId: string,
  filtros: AuditoriaFilter,
  limite: number,
) {
  return prisma.auditoria.findMany({
    where: buildAuditoriaWhere(colegioId, filtros),
    orderBy: { dataHora: "desc" },
    take: limite,
    select: auditoriaListSelect,
  });
}

export async function listAuditoriaFacets(colegioId: string) {
  const where = scopeWhere(colegioId);
  const [acoes, entidades] = await Promise.all([
    prisma.auditoria.findMany({
      where,
      distinct: ["acao"],
      orderBy: { acao: "asc" },
      select: { acao: true },
      take: 200,
    }),
    prisma.auditoria.findMany({
      where: { ...where, entidade: { not: null } },
      distinct: ["entidade"],
      orderBy: { entidade: "asc" },
      select: { entidade: true },
      take: 200,
    }),
  ]);

  return {
    acoes: acoes.map((row) => row.acao),
    entidades: entidades
      .map((row) => row.entidade)
      .filter((value): value is string => value !== null),
  };
}
