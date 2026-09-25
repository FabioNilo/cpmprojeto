import {
  LIMITE_ACOMPANHAMENTO,
  SALDO_MAXIMO,
  SALDO_MINIMO,
} from "../constants";

export type FaixaRef = {
  codigo: string;
  nome: string;
  limiteInferior: number;
  limiteSuperior: number;
  exigeAcompanhamento: boolean;
};

// Saldo exibido: entre 0.00 e 10.00, com 2 casas (anexoA secao 8).
export function clampSaldo(valor: number): number {
  const limitado = Math.min(SALDO_MAXIMO, Math.max(SALDO_MINIMO, valor));
  return Math.round(limitado * 100) / 100;
}

export function classificarFaixa(
  saldo: number,
  faixas: FaixaRef[],
): FaixaRef | null {
  const s = clampSaldo(saldo);
  return (
    faixas.find(
      (faixa) => s >= faixa.limiteInferior && s <= faixa.limiteSuperior,
    ) ?? null
  );
}

// anexoA secao 8: aluno com pontuacao abaixo de 6.00 deve ser destacado para
// acompanhamento disciplinar e ciencia da familia.
export function precisaAcompanhamento(saldo: number): boolean {
  return clampSaldo(saldo) < LIMITE_ACOMPANHAMENTO;
}
