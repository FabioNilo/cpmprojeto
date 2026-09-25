import { describe, expect, it } from "vitest";

import { aplicarSancaoSchema } from "./sancao-schemas";

const base = {
  ocorrenciaAlunoId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  decisaoId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
};

describe("aplicarSancaoSchema > impactoPontosManual", () => {
  it("aceita ausente (fluxo padrao, sem necessidadeEspecial)", () => {
    const resultado = aplicarSancaoSchema.safeParse(base);
    expect(resultado.success).toBe(true);
    expect(resultado.success && resultado.data.impactoPontosManual).toBeUndefined();
  });

  it("aceita valor negativo dentro do intervalo", () => {
    const resultado = aplicarSancaoSchema.safeParse({
      ...base,
      impactoPontosManual: "-0.25",
    });
    expect(resultado.success).toBe(true);
    expect(resultado.success && resultado.data.impactoPontosManual).toBe(-0.25);
  });

  it("aceita zero (decisao de nao descontar pontos)", () => {
    const resultado = aplicarSancaoSchema.safeParse({
      ...base,
      impactoPontosManual: "0",
    });
    expect(resultado.success).toBe(true);
    expect(resultado.success && resultado.data.impactoPontosManual).toBe(0);
  });

  it("rejeita valor positivo", () => {
    const resultado = aplicarSancaoSchema.safeParse({
      ...base,
      impactoPontosManual: "1.5",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita valor abaixo de -10", () => {
    const resultado = aplicarSancaoSchema.safeParse({
      ...base,
      impactoPontosManual: "-10.5",
    });
    expect(resultado.success).toBe(false);
  });

  it("string vazia e tratada como ausente", () => {
    const resultado = aplicarSancaoSchema.safeParse({
      ...base,
      impactoPontosManual: "",
    });
    expect(resultado.success).toBe(true);
    expect(resultado.success && resultado.data.impactoPontosManual).toBeUndefined();
  });
});
