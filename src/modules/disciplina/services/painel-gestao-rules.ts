import { ROLE_CODES } from "@/modules/rbac/permissions";

import type { StatusOcorrencia } from "../constants";

const PERFIS_GESTAO: readonly string[] = [
  ROLE_CODES.ADMINISTRADOR,
  ROLE_CODES.DIRETOR_PM,
  ROLE_CODES.DIRETOR_ADJUNTO,
  ROLE_CODES.CHEFE_CORPO_ALUNOS,
];

export function podeVerPainelGestao(perfis: readonly string[]): boolean {
  return perfis.some((perfil) => PERFIS_GESTAO.includes(perfil));
}

// Referencia de gestao definida com o usuario. O Anexo A nao fixa esse prazo.
export const DIAS_LIMITE_NORMAL = 7;
export const DIAS_LIMITE_ATENCAO = 15;

export type SituacaoPendencia = "NORMAL" | "ATENCAO" | "ATRASO";

export const ROTULO_SITUACAO: Record<SituacaoPendencia, string> = {
  NORMAL: "No prazo",
  ATENCAO: "Atenção",
  ATRASO: "Em atraso",
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function diasDesde(desde: Date, agora: Date): number {
  return Math.max(0, Math.floor((agora.getTime() - desde.getTime()) / MS_POR_DIA));
}

export function classificarSituacao(dias: number): SituacaoPendencia {
  if (dias <= DIAS_LIMITE_NORMAL) {
    return "NORMAL";
  }
  return dias <= DIAS_LIMITE_ATENCAO ? "ATENCAO" : "ATRASO";
}

export type TipoPendencia =
  | "SEM_DECISAO"
  | "SANCAO_NAO_CUMPRIDA"
  | "RECONSIDERACAO_PENDENTE";

export const ROTULO_PENDENCIA: Record<TipoPendencia, string> = {
  SEM_DECISAO: "Sem decisão",
  SANCAO_NAO_CUMPRIDA: "Sanção não cumprida",
  RECONSIDERACAO_PENDENTE: "Reconsideração pendente",
};

export type EntradaPendencia = {
  id: string;
  tipo: TipoPendencia;
  desde: Date;
  sancaoId?: string;
  ocorrenciaId: string;
  numero: string | null;
  alunoNome: string;
};

export type Pendencia = EntradaPendencia & {
  dias: number;
  situacao: SituacaoPendencia;
};

// A mesma sancao nao conta duas vezes: com reconsideracao pendente, a acao
// esperada e decidir o pedido. Mais antigas primeiro.
export function montarPendencias(
  entradas: readonly EntradaPendencia[],
  agora: Date,
): Pendencia[] {
  const emReconsideracao = new Set(
    entradas
      .filter((e) => e.tipo === "RECONSIDERACAO_PENDENTE")
      .map((e) => e.sancaoId),
  );
  return entradas
    .filter(
      (e) =>
        e.tipo !== "SANCAO_NAO_CUMPRIDA" || !emReconsideracao.has(e.sancaoId),
    )
    .map((e) => {
      const dias = diasDesde(e.desde, agora);
      return { ...e, dias, situacao: classificarSituacao(dias) };
    })
    .sort((a, b) => a.desde.getTime() - b.desde.getTime());
}

export function contarPorSituacao(
  pendencias: readonly Pendencia[],
): Record<SituacaoPendencia, number> {
  const total: Record<SituacaoPendencia, number> = {
    NORMAL: 0,
    ATENCAO: 0,
    ATRASO: 0,
  };
  for (const p of pendencias) {
    total[p.situacao] += 1;
  }
  return total;
}

export const ROTULO_STATUS_OCORRENCIA: Record<StatusOcorrencia, string> = {
  RASCUNHO: "Rascunho",
  ENVIADA: "Enviada",
  EM_AVERIGUACAO: "Em averiguação",
  AGUARDANDO_MANIFESTACAO: "Aguardando manifestação",
  AGUARDANDO_CIENCIA: "Aguardando ciência",
  EM_ANALISE: "Em análise",
  DECIDIDA: "Decidida",
  ENCERRADA: "Encerrada",
  ARQUIVADA: "Arquivada",
};

export type PresetPeriodo = "ano" | "mes" | "30d" | "livre";

export type Periodo = {
  preset: PresetPeriodo;
  rotulo: string;
  // Dias no formato AAAA-MM-DD, horario de Brasilia, ambos inclusivos.
  de: string;
  ate: string;
  inicio: Date;
  fimExclusivo: Date;
};

const DIA_VALIDO = /^\d{4}-\d{2}-\d{2}$/;

function diaLocal(data: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

function inicioDoDia(dia: string): Date {
  return new Date(`${dia}T00:00:00-03:00`);
}

function diaEhValido(dia: string | undefined): dia is string {
  if (!dia || !DIA_VALIDO.test(dia)) {
    return false;
  }
  const data = inicioDoDia(dia);
  return !Number.isNaN(data.getTime()) && diaLocal(data) === dia;
}

function montarPeriodo(
  preset: PresetPeriodo,
  rotulo: string,
  de: string,
  ate: string,
): Periodo {
  return {
    preset,
    rotulo,
    de,
    ate,
    inicio: inicioDoDia(de),
    fimExclusivo: new Date(inicioDoDia(ate).getTime() + MS_POR_DIA),
  };
}

// Valor invalido na URL volta para o ano letivo, sem erro para o usuario.
export function resolverPeriodo(
  params: { periodo?: string; de?: string; ate?: string },
  anoLetivo: number,
  agora: Date,
): Periodo {
  const hoje = diaLocal(agora);
  if (params.periodo === "mes") {
    return montarPeriodo("mes", "Este mês", `${hoje.slice(0, 7)}-01`, hoje);
  }
  if (params.periodo === "30d") {
    const inicio = diaLocal(new Date(agora.getTime() - 29 * MS_POR_DIA));
    return montarPeriodo("30d", "Últimos 30 dias", inicio, hoje);
  }
  if (
    params.periodo === "livre" &&
    diaEhValido(params.de) &&
    diaEhValido(params.ate) &&
    params.de <= params.ate
  ) {
    const formato = (dia: string) => dia.split("-").reverse().join("/");
    return montarPeriodo(
      "livre",
      `${formato(params.de)} a ${formato(params.ate)}`,
      params.de,
      params.ate,
    );
  }
  return montarPeriodo(
    "ano",
    `Ano letivo ${anoLetivo}`,
    `${anoLetivo}-01-01`,
    `${anoLetivo}-12-31`,
  );
}
