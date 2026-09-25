import { describe, expect, it } from "vitest";

import {
  classificarFaixa,
  clampSaldo,
  precisaAcompanhamento,
  type FaixaRef,
} from "./faixa-comportamento";

// Faixas do anexoA secao 8.
const FAIXAS: FaixaRef[] = [
  { codigo: "EXCEPCIONAL", nome: "Excepcional", limiteInferior: 10, limiteSuperior: 10, exigeAcompanhamento: false },
  { codigo: "OTIMO", nome: "Otimo", limiteInferior: 9, limiteSuperior: 9.99, exigeAcompanhamento: false },
  { codigo: "BOM", nome: "Bom", limiteInferior: 7, limiteSuperior: 8.99, exigeAcompanhamento: false },
  { codigo: "REGULAR", nome: "Regular", limiteInferior: 5, limiteSuperior: 6.99, exigeAcompanhamento: true },
  { codigo: "INSUFICIENTE", nome: "Insuficiente", limiteInferior: 2, limiteSuperior: 4.99, exigeAcompanhamento: true },
  { codigo: "INCOMPATIVEL", nome: "Incompativel", limiteInferior: 0, limiteSuperior: 1.99, exigeAcompanhamento: true },
];

describe("clampSaldo", () => {
  it("mantem entre 0 e 10 com duas casas", () => {
    expect(clampSaldo(8)).toBe(8);
    expect(clampSaldo(-3.5)).toBe(0);
    expect(clampSaldo(11.2)).toBe(10);
    expect(clampSaldo(7.005)).toBe(7.01);
  });
});

describe("classificarFaixa", () => {
  it("pontuacao inicial 8.00 cai em BOM", () => {
    expect(classificarFaixa(8, FAIXAS)?.codigo).toBe("BOM");
  });

  it("classifica os limites de cada faixa", () => {
    expect(classificarFaixa(10, FAIXAS)?.codigo).toBe("EXCEPCIONAL");
    expect(classificarFaixa(9, FAIXAS)?.codigo).toBe("OTIMO");
    expect(classificarFaixa(6.99, FAIXAS)?.codigo).toBe("REGULAR");
    expect(classificarFaixa(4.99, FAIXAS)?.codigo).toBe("INSUFICIENTE");
    expect(classificarFaixa(1.99, FAIXAS)?.codigo).toBe("INCOMPATIVEL");
    expect(classificarFaixa(0, FAIXAS)?.codigo).toBe("INCOMPATIVEL");
  });

  it("aplica clamp antes de classificar", () => {
    expect(classificarFaixa(50, FAIXAS)?.codigo).toBe("EXCEPCIONAL");
    expect(classificarFaixa(-1, FAIXAS)?.codigo).toBe("INCOMPATIVEL");
  });
});

describe("precisaAcompanhamento", () => {
  it("dispara abaixo de 6.00", () => {
    expect(precisaAcompanhamento(5.99)).toBe(true);
    expect(precisaAcompanhamento(6)).toBe(false);
    expect(precisaAcompanhamento(8)).toBe(false);
  });
});
