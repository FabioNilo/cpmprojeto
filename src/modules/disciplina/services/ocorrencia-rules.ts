import {
  TIPOS_OCORRENCIA_COM_PRAZO_48H,
  type StatusOcorrencia,
  type TipoOcorrencia,
} from "../constants";

// anexoA secao 1/3: a ocorrencia so pode ter o texto do fato editado antes de
// qualquer comunicacao ao responsavel (ate a averiguacao).
const STATUS_EDITAVEIS: readonly StatusOcorrencia[] = [
  "RASCUNHO",
  "ENVIADA",
  "EM_AVERIGUACAO",
];

// Cancelamento = arquivamento com motivo. Nao se cancela o que ja foi decidido
// ou encerrado.
const STATUS_NAO_CANCELAVEIS: readonly StatusOcorrencia[] = [
  "DECIDIDA",
  "ENCERRADA",
  "ARQUIVADA",
];

export function podeEditarOcorrencia(status: StatusOcorrencia): boolean {
  return STATUS_EDITAVEIS.includes(status);
}

export function podeArquivarOcorrencia(status: StatusOcorrencia): boolean {
  return !STATUS_NAO_CANCELAVEIS.includes(status);
}

// A composicao de alunos (comunicacao individual x coletiva) e fixada no envio.
export function podeAlterarAlunos(status: StatusOcorrencia): boolean {
  return status === "RASCUNHO";
}

export function podeEnviarOcorrencia(status: StatusOcorrencia): boolean {
  return status === "RASCUNHO";
}

export function podeIniciarAveriguacao(status: StatusOcorrencia): boolean {
  return status === "ENVIADA";
}

export function exigePrazo48h(tipo: TipoOcorrencia): boolean {
  return TIPOS_OCORRENCIA_COM_PRAZO_48H.includes(tipo);
}

export function proximoSequencial(maiorAtual: number | null): number {
  return (maiorAtual ?? 0) + 1;
}

// Numeracao oficial provisoria ate o Regimento definir o formato.
export function formatarNumeroOcorrencia(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}/${ano}/${String(sequencial).padStart(4, "0")}`;
}

export function formatarNumeroProcesso(
  numeroOcorrencia: string,
  ordem: number,
): string {
  return `${numeroOcorrencia}-${String(ordem).padStart(2, "0")}`;
}
