import { describe, expect, it } from "vitest";

import {
  agravaSancao,
  dentroDoPrazoReconsideracao,
  formatarNumeroDespacho,
  perfilDecisorReconsideracao,
  perfilPodeDecidirReconsideracao,
  podeDecidirReconsideracao,
  podeSolicitarReconsideracao,
  prazoFinalReconsideracao,
  type CompetenciaReconsideracao,
} from "./reconsideracao-rules";

const competencias: CompetenciaReconsideracao[] = [
  { perfilCodigo: "CHEFE_CORPO_ALUNOS", naturezaMax: "LEVE" },
  { perfilCodigo: "DIRETOR_ADJUNTO", naturezaMax: "MEDIA" },
  { perfilCodigo: "DIRETOR_PM", naturezaMax: "ELIMINATORIA" },
];

describe("reconsideracao-rules", () => {
  it("prazo de 15 dias corridos", () => {
    const base = new Date("2026-03-10T00:00:00Z");
    expect(prazoFinalReconsideracao(base).getUTCDate()).toBe(25);
    expect(
      dentroDoPrazoReconsideracao(base, new Date("2026-03-24T00:00:00Z")),
    ).toBe(true);
    expect(
      dentroDoPrazoReconsideracao(base, new Date("2026-03-26T00:00:00Z")),
    ).toBe(false);
  });

  it("so solicita sobre sancao ativa/suspensa/cumprida e sem pendente", () => {
    expect(podeSolicitarReconsideracao("ATIVA", false)).toBe(true);
    expect(podeSolicitarReconsideracao("SUSPENSA", false)).toBe(true);
    expect(podeSolicitarReconsideracao("ATIVA", true)).toBe(false);
    expect(podeSolicitarReconsideracao("ANULADA", false)).toBe(false);
    expect(podeDecidirReconsideracao("PENDENTE")).toBe(true);
    expect(podeDecidirReconsideracao("DEFERIDA")).toBe(false);
  });

  it("competencia por natureza (secao 12)", () => {
    expect(perfilPodeDecidirReconsideracao("LEVE", competencias)).toBe(true);
    expect(
      perfilPodeDecidirReconsideracao("GRAVE", [competencias[0]]),
    ).toBe(false);
    expect(
      perfilPodeDecidirReconsideracao("GRAVE", [competencias[2]]),
    ).toBe(true);
    expect(perfilDecisorReconsideracao("LEVE", competencias)).toBe(
      "CHEFE_CORPO_ALUNOS",
    );
    expect(perfilDecisorReconsideracao("MEDIA", competencias)).toBe(
      "DIRETOR_ADJUNTO",
    );
  });

  it("nao pode agravar a sancao", () => {
    // ordem 2 (advertencia) -> ordem 3 (repreensao) = agrava
    expect(agravaSancao(2, null, 3, null)).toBe(true);
    // manter ou reduzir tipo = ok
    expect(agravaSancao(3, null, 2, null)).toBe(false);
    // mesmo tipo, mais dias = agrava
    expect(agravaSancao(4, 3, 4, 5)).toBe(true);
    expect(agravaSancao(4, 5, 4, 3)).toBe(false);
  });

  it("numera o despacho", () => {
    expect(formatarNumeroDespacho("CPM-BA-RG", 2026, 2)).toBe(
      "CPM-BA-RG-DESP/2026/0002",
    );
  });
});
