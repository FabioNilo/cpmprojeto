import { describe, expect, it } from "vitest";

import {
  calcularSaldoBruto,
  resumoPontuacao,
  valorMovimentoCompensatorio,
  valorMovimentoSancao,
} from "./pontuacao";

describe("pontuacao", () => {
  it("parte de 8.00 e soma o ledger", () => {
    expect(calcularSaldoBruto([])).toBe(8);
    expect(
      calcularSaldoBruto([{ valor: -0.1 }, { valor: -0.2 }, { valor: 0.05 }]),
    ).toBe(7.75);
  });

  it("saldo exibido fica limitado a 0-10 mas o bruto nao", () => {
    const abaixo = resumoPontuacao([{ valor: -9 }]);
    expect(abaixo.saldoBruto).toBe(-1);
    expect(abaixo.saldoExibido).toBe(0);
    expect(abaixo.exigeAcompanhamento).toBe(true);

    const acima = resumoPontuacao([{ valor: 5 }]);
    expect(acima.saldoBruto).toBe(13);
    expect(acima.saldoExibido).toBe(10);
    expect(acima.exigeAcompanhamento).toBe(false);
  });

  it("exige acompanhamento abaixo de 6.00", () => {
    expect(resumoPontuacao([{ valor: -2.5 }]).exigeAcompanhamento).toBe(true);
    expect(resumoPontuacao([{ valor: -1.5 }]).exigeAcompanhamento).toBe(false);
  });

  it("movimento de sancao mantem o sinal; compensatorio inverte", () => {
    expect(valorMovimentoSancao(-0.3)).toBe(-0.3);
    expect(valorMovimentoCompensatorio(-0.3)).toBe(0.3);
    expect(valorMovimentoSancao(0)).toBe(0);
  });
});
