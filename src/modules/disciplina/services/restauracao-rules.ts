// anexoA secao 9: uma sancao que retirou pontos tem os pontos restaurados
// apos 1 ano, como NOVA movimentacao (RESTAURACAO_SANCAO). A sancao antiga
// nao e apagada.
export const RESTAURACAO_APOS_MESES = 12;

export type SancaoRestauravel = {
  id: string;
  impactoPontos: number;
  aplicadaEm: Date;
  status: "ATIVA" | "SUSPENSA" | "ANULADA" | "CUMPRIDA";
  jaRestaurada: boolean;
};

export function dataRestauracao(aplicadaEm: Date): Date {
  const alvo = new Date(aplicadaEm);
  alvo.setMonth(alvo.getMonth() + RESTAURACAO_APOS_MESES);
  return alvo;
}

export function restauracaoDevida(
  sancao: SancaoRestauravel,
  referencia: Date,
): boolean {
  if (sancao.jaRestaurada) {
    return false;
  }
  // Sancao anulada ja teve o efeito revertido por outro movimento.
  if (sancao.status === "ANULADA") {
    return false;
  }
  // Impedimento / transferencia compulsoria nao descontaram pontos.
  if (sancao.impactoPontos >= 0) {
    return false;
  }
  return referencia.getTime() >= dataRestauracao(sancao.aplicadaEm).getTime();
}

export function valorRestauracao(impactoPontos: number): number {
  return Math.round(-impactoPontos * 100) / 100;
}
