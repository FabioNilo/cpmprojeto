import "server-only";

import { prisma } from "@/db/prisma";

import { classificarFaixa, type FaixaRef } from "../services/faixa-comportamento";
import { getResumoPontuacao } from "./get-resumo-pontuacao";

export async function carregarFaixas(): Promise<FaixaRef[]> {
  const faixas = await prisma.faixaComportamento.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });
  return faixas.map((f) => ({
    codigo: f.codigo,
    nome: f.nome,
    limiteInferior: Number(f.limiteInferior),
    limiteSuperior: Number(f.limiteSuperior),
    exigeAcompanhamento: f.exigeAcompanhamento,
  }));
}

export type FiltroComportamento = {
  faixaCodigo?: string;
  somenteAcompanhamento?: boolean;
  serie?: string;
  sala?: string;
  termo?: string;
};

export const POR_PAGINA_COMPORTAMENTO = 200;

// Egress: antes buscava nome+matricula+turma (com join) de TODOS os alunos do
// recorte pra so exibir 200. Agora e em 2 passos - (1) so id/nome/matricula
// (sem join de turma) de todo o recorte, o suficiente pra ordenar, calcular
// faixa/acompanhamento (via getResumoPontuacao, que ja e um GROUP BY leve) e
// contar o total certo mesmo com filtro de faixa; (2) o join de turma (a
// parte mais cara) so pros ids que de fato aparecem na pagina pedida.
export async function listComportamento(
  colegioId: string,
  filtro: FiltroComportamento = {},
  pagina = 1,
) {
  const termo = filtro.termo?.trim() || undefined;
  const turmaCond: Array<{ nome: object }> = [];
  if (filtro.serie) turmaCond.push({ nome: { startsWith: `${filtro.serie} ` } });
  if (filtro.sala) turmaCond.push({ nome: { endsWith: ` ${filtro.sala}` } });

  const [vinculos, faixas] = await Promise.all([
    prisma.alunoVinculoColegio.findMany({
      where: {
        colegioId,
        status: "ATIVO",
        aluno: {
          ativo: true,
          ...(turmaCond.length > 0
            ? {
                matriculas: {
                  some: { colegioId, ativa: true, turma: { AND: turmaCond } },
                },
              }
            : {}),
          ...(termo
            ? {
                OR: [
                  { nome: { contains: termo, mode: "insensitive" as const } },
                  { matriculaGeral: { contains: termo } },
                ],
              }
            : {}),
        },
      },
      orderBy: { aluno: { nome: "asc" } },
      select: {
        aluno: { select: { id: true, nome: true, matriculaGeral: true } },
      },
    }),
    carregarFaixas(),
  ]);

  const alunoIds = vinculos.map((v) => v.aluno.id);
  const resumoMap = await getResumoPontuacao(colegioId, alunoIds);

  let candidatos = vinculos.map((v) => {
    const resumo = resumoMap.get(v.aluno.id) ?? {
      saldoBruto: 8,
      saldoExibido: 8,
      exigeAcompanhamento: false,
      totalMovimentos: 0,
    };
    return {
      aluno: v.aluno,
      saldoBruto: resumo.saldoBruto,
      saldoExibido: resumo.saldoExibido,
      exigeAcompanhamento: resumo.exigeAcompanhamento,
      totalMovimentos: resumo.totalMovimentos,
      faixa: classificarFaixa(resumo.saldoExibido, faixas),
    };
  });

  if (filtro.faixaCodigo) {
    candidatos = candidatos.filter((l) => l.faixa?.codigo === filtro.faixaCodigo);
  }
  if (filtro.somenteAcompanhamento) {
    candidatos = candidatos.filter((l) => l.exigeAcompanhamento);
  }

  const totalAlunos = candidatos.length;
  const emAcompanhamento = candidatos.filter((l) => l.exigeAcompanhamento).length;
  const totalPaginas = Math.max(1, Math.ceil(totalAlunos / POR_PAGINA_COMPORTAMENTO));
  const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA_COMPORTAMENTO;
  const pagina_ = candidatos.slice(inicio, inicio + POR_PAGINA_COMPORTAMENTO);

  // So agora busca a turma (join) - so pra quem de fato vai aparecer.
  const turmasPorAluno = await prisma.aluno.findMany({
    where: { id: { in: pagina_.map((c) => c.aluno.id) } },
    select: {
      id: true,
      matriculas: {
        where: { colegioId, ativa: true },
        select: { turma: { select: { nome: true } } },
        take: 1,
      },
    },
  });
  const turmaMap = new Map(
    turmasPorAluno.map((a) => [a.id, a.matriculas[0]?.turma.nome ?? null]),
  );

  const linhas = pagina_.map((c) => ({
    aluno: c.aluno,
    turma: turmaMap.get(c.aluno.id) ?? null,
    saldoBruto: c.saldoBruto,
    saldoExibido: c.saldoExibido,
    exigeAcompanhamento: c.exigeAcompanhamento,
    totalMovimentos: c.totalMovimentos,
    faixa: c.faixa,
  }));

  return {
    linhas,
    faixas,
    totalAlunos,
    emAcompanhamento,
    paginaAtual,
    totalPaginas,
  };
}
