import { describe, expect, it } from "vitest";

import {
  exigePrazo48h,
  formatarNumeroOcorrencia,
  formatarNumeroProcesso,
  podeAlterarAlunos,
  podeArquivarOcorrencia,
  podeEditarOcorrencia,
  podeEnviarOcorrencia,
  podeIniciarAveriguacao,
  proximoSequencial,
} from "./ocorrencia-rules";

describe("ocorrencia-rules", () => {
  it("edita ocorrencia so antes da ciencia/analise", () => {
    expect(podeEditarOcorrencia("RASCUNHO")).toBe(true);
    expect(podeEditarOcorrencia("EM_AVERIGUACAO")).toBe(true);
    expect(podeEditarOcorrencia("AGUARDANDO_CIENCIA")).toBe(false);
    expect(podeEditarOcorrencia("DECIDIDA")).toBe(false);
  });

  it("arquiva enquanto nao decidida/encerrada/arquivada", () => {
    expect(podeArquivarOcorrencia("ENVIADA")).toBe(true);
    expect(podeArquivarOcorrencia("EM_ANALISE")).toBe(true);
    expect(podeArquivarOcorrencia("DECIDIDA")).toBe(false);
    expect(podeArquivarOcorrencia("ARQUIVADA")).toBe(false);
  });

  it("altera composicao de alunos so no rascunho", () => {
    expect(podeAlterarAlunos("RASCUNHO")).toBe(true);
    expect(podeAlterarAlunos("ENVIADA")).toBe(false);
  });

  it("controla as transicoes de envio e averiguacao", () => {
    expect(podeEnviarOcorrencia("RASCUNHO")).toBe(true);
    expect(podeEnviarOcorrencia("ENVIADA")).toBe(false);
    expect(podeIniciarAveriguacao("ENVIADA")).toBe(true);
    expect(podeIniciarAveriguacao("RASCUNHO")).toBe(false);
  });

  it("prazo de 48h so para falta/atraso escolar", () => {
    expect(exigePrazo48h("FALTA_ESCOLAR")).toBe(true);
    expect(exigePrazo48h("ATRASO_ESCOLAR")).toBe(true);
    expect(exigePrazo48h("DISCIPLINAR")).toBe(false);
  });

  it("numera de forma sequencial e formatada", () => {
    expect(proximoSequencial(null)).toBe(1);
    expect(proximoSequencial(7)).toBe(8);
    expect(formatarNumeroOcorrencia("CPM-BA-SEDE", 2026, 8)).toBe(
      "CPM-BA-SEDE/2026/0008",
    );
    expect(formatarNumeroProcesso("CPM-BA-SEDE/2026/0008", 2)).toBe(
      "CPM-BA-SEDE/2026/0008-02",
    );
  });
});
