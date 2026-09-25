import "server-only";

import { prisma } from "@/db/prisma";

import { classificarFaixa } from "../services/faixa-comportamento";
import { getResumoPontuacao } from "./get-resumo-pontuacao";
import { carregarFaixas } from "./list-comportamento";

// Painel disciplinar do colegio ativo (anexoA - visao gerencial).
export async function getIndicadoresDisciplina(colegioId: string) {
  const [
    ocorrenciasPorStatus,
    processosPorStatus,
    sancoesPorTipo,
    reconsideracoesPendentes,
    afastamentosAtivos,
    vinculos,
    topReincidentes,
    faixas,
  ] = await Promise.all([
    prisma.ocorrencia.groupBy({
      by: ["status"],
      where: { colegioId },
      _count: { _all: true },
    }),
    prisma.ocorrenciaAluno.groupBy({
      by: ["status"],
      where: { ocorrencia: { colegioId } },
      _count: { _all: true },
    }),
    prisma.sancao.groupBy({
      by: ["tipoSancaoCodigo", "status"],
      where: { ocorrenciaAluno: { ocorrencia: { colegioId } } },
      _count: { _all: true },
    }),
    prisma.reconsideracao.count({
      where: {
        status: "PENDENTE",
        ocorrenciaAluno: { ocorrencia: { colegioId } },
      },
    }),
    prisma.afastamentoCautelar.count({
      where: { colegioId, status: { in: ["ATIVO", "PRORROGADO"] } },
    }),
    prisma.alunoVinculoColegio.findMany({
      where: { colegioId, status: "ATIVO", aluno: { ativo: true } },
      select: { alunoId: true },
    }),
    prisma.ocorrenciaAluno.groupBy({
      by: ["alunoId"],
      where: { ocorrencia: { colegioId }, status: "PROCEDENTE" },
      _count: { _all: true },
      orderBy: { _count: { alunoId: "desc" } },
      take: 10,
    }),
    carregarFaixas(),
  ]);

  const alunoIds = vinculos.map((v) => v.alunoId);
  const resumoMap = await getResumoPontuacao(colegioId, alunoIds);

  const distribuicaoFaixa = new Map<string, number>();
  let emAcompanhamento = 0;
  for (const alunoId of alunoIds) {
    const resumo = resumoMap.get(alunoId);
    const saldo = resumo?.saldoExibido ?? 8;
    const faixa = classificarFaixa(saldo, faixas);
    const chave = faixa?.codigo ?? "SEM_FAIXA";
    distribuicaoFaixa.set(chave, (distribuicaoFaixa.get(chave) ?? 0) + 1);
    if (resumo?.exigeAcompanhamento) {
      emAcompanhamento += 1;
    }
  }

  const nomesReincidentes = await prisma.aluno.findMany({
    where: { id: { in: topReincidentes.map((t) => t.alunoId) } },
    select: { id: true, nome: true, matriculaGeral: true },
  });
  const nomePorId = new Map(nomesReincidentes.map((a) => [a.id, a]));

  return {
    totalAlunos: alunoIds.length,
    emAcompanhamento,
    reconsideracoesPendentes,
    afastamentosAtivos,
    ocorrenciasPorStatus: ocorrenciasPorStatus.map((o) => ({
      status: o.status,
      total: o._count._all,
    })),
    processosPorStatus: processosPorStatus.map((p) => ({
      status: p.status,
      total: p._count._all,
    })),
    sancoesPorTipo: sancoesPorTipo.map((s) => ({
      tipo: s.tipoSancaoCodigo,
      status: s.status,
      total: s._count._all,
    })),
    distribuicaoFaixa: faixas.map((f) => ({
      codigo: f.codigo,
      nome: f.nome,
      total: distribuicaoFaixa.get(f.codigo) ?? 0,
    })),
    topReincidentes: topReincidentes.map((t) => ({
      alunoId: t.alunoId,
      nome: nomePorId.get(t.alunoId)?.nome ?? "-",
      matricula: nomePorId.get(t.alunoId)?.matriculaGeral ?? "-",
      procedentes: t._count._all,
    })),
  };
}
