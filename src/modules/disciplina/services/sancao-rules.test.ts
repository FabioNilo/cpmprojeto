import { describe, expect, it } from "vitest";

import {
  formatarNumeroPublicacao,
  podeAnularSancao,
  podeAplicarSancao,
  podeRegistrarCumprimento,
  podeRetomarEfeitos,
  podeSuspenderEfeitos,
  resolverImpactoSancao,
} from "./sancao-rules";

describe("sancao-rules", () => {
  it("so aplica sancao de decisao PROCEDENTE ativa sem sancao vigente", () => {
    expect(podeAplicarSancao("PROCEDENTE", false, false)).toBe(true);
    expect(podeAplicarSancao("PROCEDENTE", false, true)).toBe(false);
    expect(podeAplicarSancao("PROCEDENTE", true, false)).toBe(false);
    expect(podeAplicarSancao("IMPROCEDENTE", false, false)).toBe(false);
    expect(podeAplicarSancao("ARQUIVADO", false, false)).toBe(false);
  });

  it("transicoes de status da sancao", () => {
    expect(podeRegistrarCumprimento("ATIVA")).toBe(true);
    expect(podeRegistrarCumprimento("CUMPRIDA")).toBe(false);
    expect(podeSuspenderEfeitos("ATIVA")).toBe(true);
    expect(podeSuspenderEfeitos("SUSPENSA")).toBe(false);
    expect(podeRetomarEfeitos("SUSPENSA")).toBe(true);
    expect(podeRetomarEfeitos("ATIVA")).toBe(false);
    expect(podeAnularSancao("ATIVA")).toBe(true);
    expect(podeAnularSancao("ANULADA")).toBe(false);
  });

  it("numera o boletim de publicacao", () => {
    expect(formatarNumeroPublicacao("CPM-BA-RG", 2026, 3)).toBe(
      "CPM-BA-RG-BI/2026/0003",
    );
  });

  describe("resolverImpactoSancao", () => {
    it("usa o valor manual quando o aluno tem necessidadeEspecial e um valor foi informado", () => {
      expect(resolverImpactoSancao(true, -1.0, -0.25)).toEqual({
        impactoPontos: -0.25,
        impactoManual: true,
      });
    });

    it("usa o valor do catalogo quando o aluno tem necessidadeEspecial mas nenhum valor manual foi informado", () => {
      expect(resolverImpactoSancao(true, -1.0, null)).toEqual({
        impactoPontos: -1.0,
        impactoManual: false,
      });
    });

    it("ignora valor manual quando o aluno nao tem necessidadeEspecial", () => {
      expect(resolverImpactoSancao(false, -1.0, -0.25)).toEqual({
        impactoPontos: -1.0,
        impactoManual: false,
      });
    });

    it("aceita impacto manual zero (ex.: decisao de nao descontar pontos)", () => {
      expect(resolverImpactoSancao(true, -1.0, 0)).toEqual({
        impactoPontos: 0,
        impactoManual: true,
      });
    });
  });
});
