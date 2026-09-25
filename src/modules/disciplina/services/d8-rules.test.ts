import { describe, expect, it } from "vitest";

import {
  fimAfastamento,
  formatarNumeroConselho,
  formatarNumeroSindicancia,
  podeAvancarSindicancia,
  podeConcluirConselho,
  podeConcluirSindicancia,
  podeEncerrarAfastamento,
  podeProrrogarAfastamento,
} from "./d8-rules";

describe("d8-rules", () => {
  it("fim do afastamento soma os dias", () => {
    expect(
      fimAfastamento(new Date("2026-03-10T00:00:00Z"), 5).getUTCDate(),
    ).toBe(15);
  });

  it("afastamento: prorroga so quando ATIVO; encerra ATIVO ou PRORROGADO", () => {
    expect(podeProrrogarAfastamento("ATIVO")).toBe(true);
    expect(podeProrrogarAfastamento("PRORROGADO")).toBe(false);
    expect(podeEncerrarAfastamento("PRORROGADO")).toBe(true);
    expect(podeEncerrarAfastamento("ENCERRADO")).toBe(false);
  });

  it("sindicancia e conselho: transicoes", () => {
    expect(podeAvancarSindicancia("INSTAURADA")).toBe(true);
    expect(podeAvancarSindicancia("EM_ANDAMENTO")).toBe(false);
    expect(podeConcluirSindicancia("EM_ANDAMENTO")).toBe(true);
    expect(podeConcluirSindicancia("CONCLUIDA")).toBe(false);
    expect(podeConcluirConselho("EM_SESSAO")).toBe(true);
    expect(podeConcluirConselho("CONCLUIDO")).toBe(false);
  });

  it("numeracao de sindicancia e conselho", () => {
    expect(formatarNumeroSindicancia("CPM-BA-RG", 2026, 1)).toBe(
      "CPM-BA-RG-SIND/2026/0001",
    );
    expect(formatarNumeroConselho("CPM-BA-RG", 2026, 4)).toBe(
      "CPM-BA-RG-CD/2026/0004",
    );
  });
});
