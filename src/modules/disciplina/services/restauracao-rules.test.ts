import { describe, expect, it } from "vitest";

import {
  dataRestauracao,
  restauracaoDevida,
  valorRestauracao,
  type SancaoRestauravel,
} from "./restauracao-rules";

const base = (over: Partial<SancaoRestauravel> = {}): SancaoRestauravel => ({
  id: "s1",
  impactoPontos: -0.1,
  aplicadaEm: new Date("2026-03-10T12:00:00Z"),
  status: "ATIVA",
  jaRestaurada: false,
  ...over,
});

describe("restauracao-rules", () => {
  it("calcula a data de restauracao 12 meses apos a aplicacao", () => {
    expect(dataRestauracao(new Date("2026-03-10T00:00:00Z")).getFullYear()).toBe(
      2027,
    );
    expect(dataRestauracao(new Date("2026-03-10T00:00:00Z")).getMonth()).toBe(2);
  });

  it("restaura somente apos 1 ano", () => {
    expect(restauracaoDevida(base(), new Date("2027-03-09T00:00:00Z"))).toBe(
      false,
    );
    expect(restauracaoDevida(base(), new Date("2027-03-11T00:00:00Z"))).toBe(
      true,
    );
  });

  it("nao restaura sancao ja restaurada, anulada ou sem desconto", () => {
    const ref = new Date("2028-01-01T00:00:00Z");
    expect(restauracaoDevida(base({ jaRestaurada: true }), ref)).toBe(false);
    expect(restauracaoDevida(base({ status: "ANULADA" }), ref)).toBe(false);
    expect(restauracaoDevida(base({ impactoPontos: 0 }), ref)).toBe(false);
  });

  it("valor da restauracao inverte o impacto", () => {
    expect(valorRestauracao(-0.3)).toBe(0.3);
  });
});
