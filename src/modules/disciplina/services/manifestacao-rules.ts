import type {
  StatusOcorrencia,
  StatusProcessoAluno,
} from "../constants";

// anexoA secao 4: manifestacao/justificacao ocorre antes da analise; um
// processo ja justificado/decidido nao recebe nova manifestacao.
const OCORRENCIA_ABERTA_MANIFESTACAO: readonly StatusOcorrencia[] = [
  "ENVIADA",
  "EM_AVERIGUACAO",
  "AGUARDANDO_MANIFESTACAO",
  "AGUARDANDO_CIENCIA",
];

const PROCESSO_ABERTO: readonly StatusProcessoAluno[] = ["PENDENTE"];

export function podeManifestar(
  statusOcorrencia: StatusOcorrencia,
  statusProcesso: StatusProcessoAluno,
): boolean {
  return (
    OCORRENCIA_ABERTA_MANIFESTACAO.includes(statusOcorrencia) &&
    PROCESSO_ABERTO.includes(statusProcesso)
  );
}

// anexoA secao 11: a ciencia exige acao formal explicita.
export function podeConfirmarCiencia(
  statusOcorrencia: StatusOcorrencia,
  jaTemCiencia: boolean,
): boolean {
  if (jaTemCiencia) {
    return false;
  }
  return (
    OCORRENCIA_ABERTA_MANIFESTACAO.includes(statusOcorrencia) ||
    statusOcorrencia === "EM_ANALISE"
  );
}

export function podeAvaliarManifestacao(
  statusProcesso: StatusProcessoAluno,
  qtdManifestacoes: number,
): boolean {
  return PROCESSO_ABERTO.includes(statusProcesso) && qtdManifestacoes > 0;
}

// anexoA secao 4: justificativa acolhida => STATUS = JUSTIFICADO e nenhuma
// sancao. Nao acolhida => segue para analise/enquadramento (permanece PENDENTE).
export function statusAposAvaliacao(
  acolhida: boolean,
): StatusProcessoAluno {
  return acolhida ? "JUSTIFICADO" : "PENDENTE";
}

// Avanco de estado da ocorrencia ao longo do fluxo do anexoA secao 3.
export function statusOcorrenciaAposManifestacao(
  atual: StatusOcorrencia,
): StatusOcorrencia {
  return atual === "ENVIADA" || atual === "EM_AVERIGUACAO"
    ? "AGUARDANDO_MANIFESTACAO"
    : atual;
}

export function statusOcorrenciaAposCiencia(
  atual: StatusOcorrencia,
): StatusOcorrencia {
  return atual === "ENCERRADA" || atual === "ARQUIVADA" || atual === "DECIDIDA"
    ? atual
    : "EM_ANALISE";
}