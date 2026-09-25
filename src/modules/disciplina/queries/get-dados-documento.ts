import "server-only";

import { prisma } from "@/db/prisma";
import { parseTurmaNome } from "@/modules/turmas/services/turma-nome";

import {
  modeloComunicacao,
  modeloDecisao,
  modeloDespachoReconsideracao,
  modeloElogio,
  modeloParecerConselho,
  modeloPortariaAfastamento,
  modeloTermoCiencia,
} from "../services/modelos-documento";
import { construirResumoFad, type ResumoFadConteudo } from "../services/fad-resumo";

// Um numero, um aluno: a comunicacao impressa e sempre a de UM processo
// (OcorrenciaAluno), mesmo quando o fato foi registrado para varios alunos
// de uma so vez. Ver modelos-documento.ts.
export async function specComunicacao(
  ocorrenciaAlunoId: string,
  colegioId: string,
) {
  const p = await prisma.ocorrenciaAluno.findFirst({
    where: { id: ocorrenciaAlunoId, ocorrencia: { colegioId } },
    select: {
      alunoId: true,
      numeroProcesso: true,
      aluno: {
        select: {
          nome: true,
          matriculaGeral: true,
          matriculas: {
            where: { colegioId, ativa: true },
            select: { turma: { select: { nome: true } } },
            take: 1,
          },
        },
      },
      ocorrencia: {
        select: {
          tipo: true,
          materia: true,
          dataOcorrencia: true,
          local: true,
          descricao: true,
          comunicante: { select: { nome: true, posto: true } },
          colegio: { select: { nome: true } },
        },
      },
    },
  });
  if (!p) return null;

  const turmaNome = p.aluno.matriculas[0]?.turma.nome ?? null;
  const { serie, sala } = turmaNome
    ? parseTurmaNome(turmaNome)
    : { serie: null, sala: null };

  return modeloComunicacao({
    unidade: p.ocorrencia.colegio.nome,
    numeroProcesso: p.numeroProcesso,
    tipo: p.ocorrencia.tipo,
    materia: p.ocorrencia.materia,
    dataOcorrencia: p.ocorrencia.dataOcorrencia,
    local: p.ocorrencia.local,
    comunicante: p.ocorrencia.comunicante.nome,
    comunicantePosto: p.ocorrencia.comunicante.posto,
    aluno: p.aluno.nome,
    matricula: p.aluno.matriculaGeral,
    serie,
    turma: sala,
    descricao: p.ocorrencia.descricao,
  });
}

export async function specElogio(elogioId: string, colegioId: string) {
  const e = await prisma.elogio.findFirst({
    where: { id: elogioId, colegioId },
    select: {
      numero: true,
      valorPontos: true,
      descricao: true,
      concedidoEm: true,
      aluno: { select: { nome: true, matriculaGeral: true } },
      tipoElogio: { select: { nome: true } },
      registradoPor: { select: { nome: true, posto: true } },
      colegio: { select: { nome: true } },
    },
  });
  if (!e) return null;
  return modeloElogio({
    unidade: e.colegio.nome,
    numero: e.numero,
    aluno: e.aluno.nome,
    matricula: e.aluno.matriculaGeral,
    tipoElogio: e.tipoElogio.nome,
    valorPontos: Number(e.valorPontos),
    descricao: e.descricao,
    concedidoEm: e.concedidoEm,
    registradoPor: e.registradoPor.nome,
    registradoPorPosto: e.registradoPor.posto,
  });
}

export async function specTermoCiencia(
  ocorrenciaAlunoId: string,
  colegioId: string,
  alvo: "OCORRENCIA" | "DECISAO",
) {
  const p = await prisma.ocorrenciaAluno.findFirst({
    where: { id: ocorrenciaAlunoId, ocorrencia: { colegioId } },
    select: {
      numeroProcesso: true,
      aluno: { select: { nome: true, matriculaGeral: true } },
      ocorrencia: { select: { colegio: { select: { nome: true } } } },
      ciencias: {
        where: { sobre: alvo },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          sobre: true,
          meio: true,
          observacao: true,
          createdAt: true,
          confirmadaPor: { select: { nome: true } },
        },
      },
    },
  });
  if (!p || p.ciencias.length === 0) return null;
  const c = p.ciencias[0];
  return modeloTermoCiencia({
    unidade: p.ocorrencia.colegio.nome,
    numeroProcesso: p.numeroProcesso,
    aluno: p.aluno.nome,
    matricula: p.aluno.matriculaGeral,
    sobre: c.sobre,
    meio: c.meio,
    dataCiencia: c.createdAt,
    confirmadaPor: c.confirmadaPor.nome,
    observacao: c.observacao,
  });
}

export async function specDecisao(
  ocorrenciaAlunoId: string,
  colegioId: string,
) {
  const p = await prisma.ocorrenciaAluno.findFirst({
    where: { id: ocorrenciaAlunoId, ocorrencia: { colegioId } },
    select: {
      numeroProcesso: true,
      aluno: { select: { nome: true, matriculaGeral: true } },
      ocorrencia: { select: { colegio: { select: { nome: true } } } },
      enquadramentos: {
        where: { revogadoEm: null },
        select: {
          natureza: true,
          transgressao: { select: { codigo: true, descricao: true } },
        },
      },
      decisoes: {
        where: { revogadoEm: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          numero: true,
          resultado: true,
          naturezaApurada: true,
          sancaoTipoCodigo: true,
          diasSancao: true,
          fundamentacao: true,
          decididoPorPerfilCodigo: true,
          decididoPor: { select: { nome: true, posto: true } },
          atenuantes: {
            select: { atenuante: { select: { descricao: true } } },
          },
          agravantes: {
            select: { agravante: { select: { descricao: true } } },
          },
        },
      },
    },
  });
  if (!p || p.decisoes.length === 0) return null;
  const d = p.decisoes[0];
  return modeloDecisao({
    unidade: p.ocorrencia.colegio.nome,
    numero: d.numero,
    numeroProcesso: p.numeroProcesso,
    aluno: p.aluno.nome,
    matricula: p.aluno.matriculaGeral,
    resultado: d.resultado,
    naturezaApurada: d.naturezaApurada,
    enquadramentos: p.enquadramentos.map((e) => ({
      transgressao: e.transgressao.codigo,
      natureza: e.natureza,
      descricao: e.transgressao.descricao,
    })),
    atenuantes: d.atenuantes.map((a) => a.atenuante.descricao),
    agravantes: d.agravantes.map((a) => a.agravante.descricao),
    sancao: d.sancaoTipoCodigo,
    dias: d.diasSancao,
    fundamentacao: d.fundamentacao,
    autoridade: d.decididoPor.nome,
    autoridadePosto: d.decididoPor.posto,
    perfilAutoridade: d.decididoPorPerfilCodigo,
  });
}

export async function specDespacho(reconsideracaoId: string, colegioId: string) {
  const r = await prisma.reconsideracao.findFirst({
    where: {
      id: reconsideracaoId,
      ocorrenciaAluno: { ocorrencia: { colegioId } },
    },
    select: {
      numero: true,
      status: true,
      parecerDecisao: true,
      novoTipoSancaoCodigo: true,
      novosDias: true,
      prazoFinal: true,
      decididoPorPerfilCodigo: true,
      decididoPor: { select: { nome: true, posto: true } },
      ocorrenciaAluno: {
        select: {
          numeroProcesso: true,
          aluno: { select: { nome: true } },
          ocorrencia: { select: { colegio: { select: { nome: true } } } },
        },
      },
      sancao: { select: { tipoSancaoCodigo: true, dias: true } },
    },
  });
  if (!r || !r.parecerDecisao) return null;
  return modeloDespachoReconsideracao({
    unidade: r.ocorrenciaAluno.ocorrencia.colegio.nome,
    numero: r.numero,
    numeroProcesso: r.ocorrenciaAluno.numeroProcesso,
    aluno: r.ocorrenciaAluno.aluno.nome,
    sancaoOriginal: `${r.sancao.tipoSancaoCodigo}${
      r.sancao.dias ? ` - ${r.sancao.dias} dias` : ""
    }`,
    status: r.status,
    parecer: r.parecerDecisao,
    novaSancao: r.novoTipoSancaoCodigo,
    novosDias: r.novosDias,
    autoridade: r.decididoPor?.nome ?? "-",
    autoridadePosto: r.decididoPor?.posto ?? null,
    perfilAutoridade: r.decididoPorPerfilCodigo ?? "-",
    prazoFinal: r.prazoFinal,
  });
}

export async function specPortaria(afastamentoId: string, colegioId: string) {
  const a = await prisma.afastamentoCautelar.findFirst({
    where: { id: afastamentoId, colegioId },
    select: {
      justificativa: true,
      diasIniciais: true,
      inicioEm: true,
      fimPrevisto: true,
      fimProrrogado: true,
      determinadoPor: { select: { nome: true } },
      colegio: { select: { nome: true } },
      ocorrenciaAluno: {
        select: { aluno: { select: { nome: true, matriculaGeral: true } } },
      },
    },
  });
  if (!a) return null;
  return modeloPortariaAfastamento({
    unidade: a.colegio.nome,
    aluno: a.ocorrenciaAluno.aluno.nome,
    matricula: a.ocorrenciaAluno.aluno.matriculaGeral,
    justificativa: a.justificativa,
    inicioEm: a.inicioEm,
    fimPrevisto: a.fimProrrogado ?? a.fimPrevisto,
    dias: a.diasIniciais,
    determinadoPor: a.determinadoPor.nome,
  });
}

export async function specParecer(conselhoId: string, colegioId: string) {
  const c = await prisma.conselhoDisciplinar.findFirst({
    where: { id: conselhoId, colegioId },
    select: {
      numero: true,
      objeto: true,
      parecer: true,
      recomendacao: true,
      votosFavor: true,
      votosContra: true,
      presididoPor: { select: { nome: true } },
      colegio: { select: { nome: true } },
      ocorrenciaAluno: { select: { aluno: { select: { nome: true } } } },
    },
  });
  if (!c || !c.parecer) return null;
  return modeloParecerConselho({
    unidade: c.colegio.nome,
    numero: c.numero,
    aluno: c.ocorrenciaAluno.aluno.nome,
    objeto: c.objeto,
    parecer: c.parecer,
    recomendacao: c.recomendacao ?? "-",
    votosFavor: c.votosFavor ?? 0,
    votosContra: c.votosContra ?? 0,
    presidente: c.presididoPor.nome,
  });
}

type FadConteudo = {
  aluno?: { nome?: string; matriculaGeral?: string | null };
  matricula?: { turma?: string; ano?: number } | null;
  pontuacao?: {
    saldoBruto?: number;
    faixa?: string | null;
  };
} & ResumoFadConteudo;

function nomeFaixa(codigo: string | null | undefined): string | null {
  if (!codigo) return null;
  return codigo.charAt(0) + codigo.slice(1).toLowerCase();
}

export async function specFad(alunoId: string, colegioId: string) {
  const ficha = await prisma.fichaDisciplinar.findFirst({
    where: { alunoId, colegioId },
    orderBy: { versao: "desc" },
    select: { versao: true, hash: true, geradoEm: true, conteudo: true },
  });
  if (!ficha) return null;
  const c = ficha.conteudo as FadConteudo;
  const colegio = await prisma.colegio.findUnique({
    where: { id: colegioId },
    select: { nome: true },
  });

  return {
    unidade: `Polícia Militar da Bahia . ${colegio?.nome ?? "-"}`,
    aluno: c.aluno?.nome ?? "-",
    matricula: c.aluno?.matriculaGeral ?? null,
    turmaAno: c.matricula
      ? `${c.matricula.turma ?? "-"}${c.matricula.ano ? ` / ${c.matricula.ano}` : ""}`
      : null,
    saldo: c.pontuacao?.saldoBruto ?? 8,
    faixaNome: nomeFaixa(c.pontuacao?.faixa),
    faixaCodigo: c.pontuacao?.faixa ?? null,
    versao: ficha.versao,
    hash: ficha.hash,
    geradoEm: ficha.geradoEm,
    resumo: construirResumoFad({
      totais: {
        processos: c.totais?.processos ?? 0,
        procedentes: c.totais?.procedentes ?? 0,
        elogios: c.totais?.elogios ?? 0,
        elogiosPontos: c.totais?.elogiosPontos ?? 0,
      },
      processos: c.processos ?? [],
    }),
  };
}
