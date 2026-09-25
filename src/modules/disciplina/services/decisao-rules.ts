import {
  NATUREZA_ORDEM,
  type NaturezaTransgressao,
  type ResultadoDecisao,
  type StatusOcorrencia,
  type StatusProcessoAluno,
} from "../constants";

// anexoA secao 3: a analise (enquadramento/decisao) acontece depois da
// averiguacao/manifestacao/ciencia e antes do encerramento.
const OCORRENCIA_ABERTA_ANALISE: readonly StatusOcorrencia[] = [
  "EM_AVERIGUACAO",
  "AGUARDANDO_MANIFESTACAO",
  "AGUARDANDO_CIENCIA",
  "EM_ANALISE",
];

export function podeEnquadrar(
  statusOcorrencia: StatusOcorrencia,
  statusProcesso: StatusProcessoAluno,
): boolean {
  return (
    OCORRENCIA_ABERTA_ANALISE.includes(statusOcorrencia) &&
    statusProcesso === "PENDENTE"
  );
}

export function podeDecidir(
  statusOcorrencia: StatusOcorrencia,
  statusProcesso: StatusProcessoAluno,
): boolean {
  return podeEnquadrar(statusOcorrencia, statusProcesso);
}

// anexoA secao 4/regra central: so ha sancao quando a falta e enquadrada.
export function exigeEnquadramento(resultado: ResultadoDecisao): boolean {
  return resultado === "PROCEDENTE";
}

export function exigeSancao(resultado: ResultadoDecisao): boolean {
  return resultado === "PROCEDENTE";
}

export function naturezaMaisGrave(
  naturezas: readonly NaturezaTransgressao[],
): NaturezaTransgressao | null {
  if (naturezas.length === 0) {
    return null;
  }
  return naturezas.reduce((maisGrave, atual) =>
    NATUREZA_ORDEM[atual] > NATUREZA_ORDEM[maisGrave] ? atual : maisGrave,
  );
}

export function statusProcessoAposDecisao(
  resultado: ResultadoDecisao,
): StatusProcessoAluno {
  switch (resultado) {
    case "PROCEDENTE":
      return "PROCEDENTE";
    case "IMPROCEDENTE":
      return "IMPROCEDENTE";
    case "ARQUIVADO":
      return "ARQUIVADO";
    case "ENCAMINHADO_SINDICANCIA":
      // O rito de sindicancia (D8) decide depois; o processo segue aberto.
      return "PENDENTE";
  }
}

// A ocorrencia so vai para DECIDIDA quando nenhum processo esta mais PENDENTE.
export function statusOcorrenciaAposDecisao(
  statusProcessos: readonly StatusProcessoAluno[],
  atual: StatusOcorrencia,
): StatusOcorrencia {
  if (atual === "ENCERRADA" || atual === "ARQUIVADA") {
    return atual;
  }
  const aindaPendente = statusProcessos.some((s) => s === "PENDENTE");
  return aindaPendente ? "EM_ANALISE" : "DECIDIDA";
}

// anexoA secao 7: competencia para aplicar sancao, validada no backend.
export type CompetenciaSancao = {
  perfilCodigo: string;
  sancaoMaxOrdem: number | null;
  diasMax: number | null;
};

export function competenciaPermiteSancao(
  competencias: readonly CompetenciaSancao[],
  sancaoOrdem: number,
  dias: number | null,
): boolean {
  return competencias.some((competencia) => {
    if (competencia.sancaoMaxOrdem === null) {
      return false;
    }
    if (sancaoOrdem > competencia.sancaoMaxOrdem) {
      return false;
    }
    if (
      competencia.diasMax !== null &&
      dias !== null &&
      dias > competencia.diasMax
    ) {
      return false;
    }
    return true;
  });
}

export function perfilComCompetencia(
  competencias: readonly CompetenciaSancao[],
  sancaoOrdem: number,
  dias: number | null,
): string | null {
  const encontrada = competencias.find((competencia) => {
    if (competencia.sancaoMaxOrdem === null) {
      return false;
    }
    if (sancaoOrdem > competencia.sancaoMaxOrdem) {
      return false;
    }
    if (
      competencia.diasMax !== null &&
      dias !== null &&
      dias > competencia.diasMax
    ) {
      return false;
    }
    return true;
  });
  return encontrada?.perfilCodigo ?? null;
}

// Numeracao oficial provisoria ate o Regimento definir o formato.
export function formatarNumeroDecisao(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}-DEC/${ano}/${String(sequencial).padStart(4, "0")}`;
}
