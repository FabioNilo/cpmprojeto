import "server-only";

import { prisma } from "@/db/prisma";

import type { StatusOcorrencia } from "../constants";
import {
  contarPorSituacao,
  montarPendencias,
  type EntradaPendencia,
  type Periodo,
} from "../services/painel-gestao-rules";

// Ano letivo ativo mais recente que ja comecou; sem cadastro, o ano corrente.
export async function getAnoLetivoAtual(
  colegioId: string,
  agora: Date,
): Promise<number> {
  const anoCorrente = agora.getFullYear();
  const anoLetivo = await prisma.anoLetivo.findFirst({
    where: { colegioId, ativo: true, ano: { lte: anoCorrente } },
    orderBy: { ano: "desc" },
    select: { ano: true },
  });
  return anoLetivo?.ano ?? anoCorrente;
}

async function listarEntradasPendencia(
  colegioId: string,
): Promise<EntradaPendencia[]> {
  const processoSelect = {
    id: true,
    numeroProcesso: true,
    aluno: { select: { nome: true } },
    ocorrencia: {
      select: {
        id: true,
        numero: true,
        enviadaEm: true,
        dataOcorrencia: true,
      },
    },
  } as const;

  const [processos, sancoes, reconsideracoes] = await Promise.all([
    prisma.ocorrenciaAluno.findMany({
      where: {
        status: "PENDENTE",
        ocorrencia: {
          colegioId,
          status: { notIn: ["RASCUNHO", "ENCERRADA", "ARQUIVADA"] },
        },
      },
      select: processoSelect,
    }),
    prisma.sancao.findMany({
      where: {
        status: { in: ["ATIVA", "SUSPENSA"] },
        ocorrenciaAluno: { ocorrencia: { colegioId } },
      },
      select: {
        id: true,
        aplicadaEm: true,
        ocorrenciaAluno: { select: processoSelect },
      },
    }),
    prisma.reconsideracao.findMany({
      where: {
        status: "PENDENTE",
        ocorrenciaAluno: { ocorrencia: { colegioId } },
      },
      select: {
        id: true,
        sancaoId: true,
        createdAt: true,
        ocorrenciaAluno: { select: processoSelect },
      },
    }),
  ]);

  type Processo = (typeof processos)[number];
  const dadosDoProcesso = (processo: Processo) => ({
    ocorrenciaId: processo.ocorrencia.id,
    numero: processo.numeroProcesso ?? processo.ocorrencia.numero,
    alunoNome: processo.aluno.nome,
  });

  return [
    ...processos.map((p) => ({
      id: `processo-${p.id}`,
      tipo: "SEM_DECISAO" as const,
      desde: p.ocorrencia.enviadaEm ?? p.ocorrencia.dataOcorrencia,
      ...dadosDoProcesso(p),
    })),
    ...sancoes.map((s) => ({
      id: `sancao-${s.id}`,
      tipo: "SANCAO_NAO_CUMPRIDA" as const,
      desde: s.aplicadaEm,
      sancaoId: s.id,
      ...dadosDoProcesso(s.ocorrenciaAluno),
    })),
    ...reconsideracoes.map((r) => ({
      id: `reconsideracao-${r.id}`,
      tipo: "RECONSIDERACAO_PENDENTE" as const,
      desde: r.createdAt,
      sancaoId: r.sancaoId,
      ...dadosDoProcesso(r.ocorrenciaAluno),
    })),
  ];
}

// Visao geral do andamento disciplinar. As pendencias nao dependem do periodo:
// um caso antigo sem solucao continua aparecendo.
export async function getPainelGestao(
  colegioId: string,
  periodo: Periodo,
  agora: Date,
) {
  const noPeriodo = { gte: periodo.inicio, lt: periodo.fimExclusivo };

  const [entradas, statusAgrupados, elogiosResumo, ultimosElogios] =
    await Promise.all([
      listarEntradasPendencia(colegioId),
      prisma.ocorrencia.groupBy({
        by: ["status"],
        where: {
          colegioId,
          dataOcorrencia: noPeriodo,
          status: { not: "RASCUNHO" },
        },
        _count: { _all: true },
      }),
      prisma.elogio.aggregate({
        where: { colegioId, concedidoEm: noPeriodo },
        _count: { _all: true },
        _sum: { valorPontos: true },
      }),
      prisma.elogio.findMany({
        where: { colegioId, concedidoEm: noPeriodo },
        orderBy: { concedidoEm: "desc" },
        take: 5,
        select: {
          id: true,
          concedidoEm: true,
          valorPontos: true,
          alunoId: true,
          aluno: { select: { nome: true } },
          tipoElogio: { select: { nome: true } },
        },
      }),
    ]);

  const pendencias = montarPendencias(entradas, agora);

  return {
    pendencias,
    situacoes: contarPorSituacao(pendencias),
    status: statusAgrupados.map((s) => ({
      status: s.status as StatusOcorrencia,
      total: s._count._all,
    })),
    elogios: {
      total: elogiosResumo._count._all,
      pontos: Number(elogiosResumo._sum.valorPontos ?? 0),
      ultimos: ultimosElogios.map((e) => ({
        id: e.id,
        alunoId: e.alunoId,
        alunoNome: e.aluno.nome,
        tipo: e.tipoElogio.nome,
        pontos: Number(e.valorPontos),
        concedidoEm: e.concedidoEm,
      })),
    },
  };
}
