import { PONTUACAO_INICIAL } from "../constants";
import { clampSaldo, precisaAcompanhamento } from "./faixa-comportamento";

export type MovimentoValor = {
  valor: number;
};

// anexoA secoes 8 e 15: a pontuacao e a soma do ledger a partir de 8.00.
// O saldo "bruto" pode passar de 0-10; o saldo exibido e sempre limitado.
export function calcularSaldoBruto(movimentos: readonly MovimentoValor[]): number {
  const soma = movimentos.reduce((total, m) => total + m.valor, 0);
  return Math.round((PONTUACAO_INICIAL + soma) * 100) / 100;
}

export function resumoPontuacao(movimentos: readonly MovimentoValor[]) {
  const saldoBruto = calcularSaldoBruto(movimentos);
  const saldoExibido = clampSaldo(saldoBruto);
  return {
    saldoBruto,
    saldoExibido,
    exigeAcompanhamento: precisaAcompanhamento(saldoBruto),
  };
}

// Valor (com sinal) do movimento gerado por uma sancao. anexoA secao 6:
// impedimento e transferencia compulsoria nao descontam pontos, mas a sancao
// permanece registrada.
export function valorMovimentoSancao(impactoPontos: number): number {
  // impactoPontos ja vem negativo do catalogo (ex.: -0.10).
  return Math.round(impactoPontos * 100) / 100;
}

// Movimento compensatorio (anulacao / restauracao apos 1 ano / suspensao de
// efeitos): inverte o impacto original.
export function valorMovimentoCompensatorio(impactoPontos: number): number {
  return Math.round(-impactoPontos * 100) / 100;
}
