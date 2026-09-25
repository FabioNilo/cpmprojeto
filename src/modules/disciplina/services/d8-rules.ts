// anexoA.txt secao 13: afastamento cautelar - maximo inicial de 5 dias letivos,
// uma unica prorrogacao por igual periodo. NAO e sancao.
export const DIAS_MAX_AFASTAMENTO = 5;

export type StatusAfastamento = "ATIVO" | "PRORROGADO" | "ENCERRADO" | "REVOGADO";
export type StatusSindicancia =
  | "INSTAURADA"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "ARQUIVADA";
export type StatusConselho = "INSTAURADO" | "EM_SESSAO" | "CONCLUIDO";

// Aproximacao: soma dias corridos. O calculo de dias letivos depende do
// calendario escolar (fora do escopo por ora).
export function fimAfastamento(inicio: Date, dias: number): Date {
  const alvo = new Date(inicio);
  alvo.setDate(alvo.getDate() + dias);
  return alvo;
}

export function podeProrrogarAfastamento(status: StatusAfastamento): boolean {
  return status === "ATIVO";
}

export function podeEncerrarAfastamento(status: StatusAfastamento): boolean {
  return status === "ATIVO" || status === "PRORROGADO";
}

export function podeAvancarSindicancia(status: StatusSindicancia): boolean {
  return status === "INSTAURADA";
}

export function podeConcluirSindicancia(status: StatusSindicancia): boolean {
  return status === "INSTAURADA" || status === "EM_ANDAMENTO";
}

export function podeConcluirConselho(status: StatusConselho): boolean {
  return status === "INSTAURADO" || status === "EM_SESSAO";
}

export function formatarNumeroSindicancia(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}-SIND/${ano}/${String(sequencial).padStart(4, "0")}`;
}

export function formatarNumeroConselho(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}-CD/${ano}/${String(sequencial).padStart(4, "0")}`;
}
