import "server-only";

import { prisma } from "@/db/prisma";

import { PONTUACAO_INICIAL } from "../constants";
import { classificarFaixa } from "../services/faixa-comportamento";
import { carregarFaixas } from "./list-comportamento";
import { getResumoPontuacao } from "./get-resumo-pontuacao";
import { getResumoElogios } from "./get-resumo-elogios";

export const POR_PAGINA_EXTRATO = 25;

// Extrato reconstruido a partir do ledger (anexoA secoes 8, 15): saldo corrente
// apos cada movimento, comecando em 8.00.
//
// Egress: o ledger so cresce (nunca e limpo), entao buscar tudo de uma vez
// nao escala. Pagina de verdade no banco (skip/take); pra manter o "saldo
// apos" correto na pagina sem reler o ledger inteiro, busca so a coluna
// `valor` (bem mais leve que a linha inteira) dos movimentos ANTERIORES a
// pagina, soma em memoria, e usa isso como saldo inicial da pagina. O saldo
// TOTAL exibido no topo vem de getResumoPontuacao (GROUP BY, ja eficiente),
// nao da soma das linhas buscadas.
export async function getExtratoAluno(
  alunoId: string,
  colegioId: string,
  pagina = 1,
) {
  const vinculo = await prisma.alunoVinculoColegio.findFirst({
    where: { alunoId, colegioId },
    select: {
      status: true,
      aluno: { select: { id: true, nome: true, matriculaGeral: true } },
    },
  });
  if (!vinculo) {
    return null;
  }

  const [faixas, resumoMap, resumoElogiosMap] = await Promise.all([
    carregarFaixas(),
    getResumoPontuacao(colegioId, [alunoId]),
    getResumoElogios(colegioId, [alunoId]),
  ]);
  const resumo = resumoMap.get(alunoId) ?? {
    saldoBruto: 8,
    saldoExibido: 8,
    exigeAcompanhamento: false,
    totalMovimentos: 0,
  };
  const resumoElogios = resumoElogiosMap.get(alunoId) ?? {
    quantidade: 0,
    pontosTotais: 0,
  };

  const totalMovimentos = resumo.totalMovimentos;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalMovimentos / POR_PAGINA_EXTRATO),
  );
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas);
  const skip = (paginaAtual - 1) * POR_PAGINA_EXTRATO;
  const ordem = [{ efetivadoEm: "asc" as const }, { createdAt: "asc" as const }];

  const anteriores =
    skip > 0
      ? await prisma.movimentoPontuacao.findMany({
          where: { alunoId, colegioId },
          orderBy: ordem,
          select: { valor: true },
          take: skip,
        })
      : [];
  const somaAnteriores = anteriores.reduce(
    (total, m) => total + Number(m.valor),
    0,
  );

  const movimentos = await prisma.movimentoPontuacao.findMany({
    where: { alunoId, colegioId },
    orderBy: ordem,
    skip,
    take: POR_PAGINA_EXTRATO,
    select: {
      id: true,
      tipo: true,
      valor: true,
      descricao: true,
      origemTipo: true,
      origemId: true,
      efetivadoEm: true,
      registradoPor: { select: { nome: true } },
    },
  });

  let corrente = Math.round((PONTUACAO_INICIAL + somaAnteriores) * 100) / 100;
  const linhas = movimentos.map((m) => {
    corrente = Math.round((corrente + Number(m.valor)) * 100) / 100;
    return {
      id: m.id,
      tipo: m.tipo,
      valor: Number(m.valor),
      descricao: m.descricao,
      origemTipo: m.origemTipo,
      origemId: m.origemId,
      efetivadoEm: m.efetivadoEm,
      registradoPor: m.registradoPor.nome,
      saldoApos: corrente,
    };
  });

  return {
    aluno: vinculo.aluno,
    vinculoStatus: vinculo.status,
    resumo,
    resumoElogios,
    faixa: classificarFaixa(resumo.saldoExibido, faixas),
    linhas,
    totalMovimentos,
    paginaAtual,
    totalPaginas,
  };
}
