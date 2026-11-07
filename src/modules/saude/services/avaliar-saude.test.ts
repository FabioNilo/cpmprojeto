import { describe, expect, it } from "vitest";

import {
  avaliarSaude,
  LIMITES_PADRAO,
  lerLimites,
  type Medidas,
} from "./avaliar-saude";

const SAUDAVEL: Medidas = {
  latenciaMs: 120,
  bancoMb: 31.4,
  schemaMb: 9.7,
  conexoesEmUso: 14,
  conexoesMax: 60,
};

describe("avaliarSaude", () => {
  it("considera ok o banco de hoje, com folga em tudo", () => {
    expect(avaliarSaude(SAUDAVEL)).toEqual({ status: "ok", alertas: [] });
  });

  it("trata banco sem resposta como critico, mesmo sem outras medidas", () => {
    expect(avaliarSaude(null)).toEqual({
      status: "critico",
      alertas: [{ codigo: "BANCO_FORA", nivel: "CRITICO" }],
    });
  });

  it("alerta o tamanho em 70% e 90% do limite de 500 MB", () => {
    expect(avaliarSaude({ ...SAUDAVEL, bancoMb: 349.9 }).status).toBe("ok");
    expect(avaliarSaude({ ...SAUDAVEL, bancoMb: 350 }).status).toBe("atencao");
    expect(avaliarSaude({ ...SAUDAVEL, bancoMb: 449.9 }).status).toBe("atencao");
    const critico = avaliarSaude({ ...SAUDAVEL, bancoMb: 450 });
    expect(critico.status).toBe("critico");
    expect(critico.alertas).toEqual([
      { codigo: "TAMANHO_ALTO", nivel: "CRITICO" },
    ]);
  });

  it("mede o tamanho contra o limite configurado", () => {
    const limites = { ...LIMITES_PADRAO, limiteBancoMb: 8192 };
    expect(avaliarSaude({ ...SAUDAVEL, bancoMb: 4000 }, limites).status).toBe("ok");
    expect(avaliarSaude({ ...SAUDAVEL, bancoMb: 6000 }, limites).status).toBe("atencao");
  });

  it("alerta conexoes em 80% e 95% do maximo", () => {
    expect(
      avaliarSaude({ ...SAUDAVEL, conexoesEmUso: 47 }).status,
    ).toBe("ok");
    expect(
      avaliarSaude({ ...SAUDAVEL, conexoesEmUso: 48 }).alertas,
    ).toEqual([{ codigo: "CONEXOES_ALTAS", nivel: "ATENCAO" }]);
    expect(
      avaliarSaude({ ...SAUDAVEL, conexoesEmUso: 57 }).status,
    ).toBe("critico");
  });

  it("ignora conexoes quando o maximo nao e conhecido", () => {
    expect(
      avaliarSaude({ ...SAUDAVEL, conexoesEmUso: 99, conexoesMax: 0 }).status,
    ).toBe("ok");
  });

  it("alerta lentidao em 1,5 s e 5 s", () => {
    expect(avaliarSaude({ ...SAUDAVEL, latenciaMs: 1499 }).status).toBe("ok");
    expect(avaliarSaude({ ...SAUDAVEL, latenciaMs: 1500 }).alertas).toEqual([
      { codigo: "BANCO_LENTO", nivel: "ATENCAO" },
    ]);
    expect(avaliarSaude({ ...SAUDAVEL, latenciaMs: 5000 }).status).toBe("critico");
  });

  it("o pior alerta define o status, e todos continuam listados", () => {
    const resultado = avaliarSaude({
      ...SAUDAVEL,
      bancoMb: 360,
      latenciaMs: 6000,
    });
    expect(resultado.status).toBe("critico");
    expect(resultado.alertas.map((a) => a.codigo).sort()).toEqual([
      "BANCO_LENTO",
      "TAMANHO_ALTO",
    ]);
  });
});

describe("lerLimites", () => {
  it("usa 500 MB quando nada foi configurado", () => {
    expect(lerLimites({}).limiteBancoMb).toBe(500);
  });

  it("aceita um limite valido", () => {
    expect(lerLimites({ MONITOR_LIMITE_BANCO_MB: "8192" }).limiteBancoMb).toBe(8192);
  });

  it("volta ao padrao com valor vazio, texto, zero ou negativo", () => {
    for (const valor of ["", "  ", "abc", "0", "-5", "NaN", "Infinity"]) {
      expect(lerLimites({ MONITOR_LIMITE_BANCO_MB: valor }).limiteBancoMb).toBe(500);
    }
  });
});
