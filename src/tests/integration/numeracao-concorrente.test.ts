import { describe, expect, it } from "vitest";

import { prisma } from "@/db/prisma";
import { proximoNumero } from "@/modules/disciplina/services/numeracao-service";

import { criarColegio } from "./helpers/factories";

describe("numeracao concorrente", () => {
  it("alocacoes simultaneas geram numeros distintos e sequenciais", async () => {
    const colegio = await criarColegio();
    const ano = 2026;
    // Lotes paralelos (o pool de conexoes de teste e pequeno; em producao os
    // envios "simultaneos" sao poucos). Cada lote roda de fato em paralelo,
    // disputando o mesmo lock de linha.
    const LOTE = 8;
    const LOTES = 3;
    const N = LOTE * LOTES;

    const resultados: number[] = [];
    for (let i = 0; i < LOTES; i += 1) {
      const parcial = await Promise.all(
        Array.from({ length: LOTE }, () =>
          prisma.$transaction((tx) =>
            proximoNumero(tx, colegio.id, "OCORRENCIA", ano),
          ),
        ),
      );
      resultados.push(...parcial);
    }

    const unicos = new Set(resultados);
    expect(unicos.size).toBe(N);
    expect(Math.min(...resultados)).toBe(1);
    expect(Math.max(...resultados)).toBe(N);

    const linha = await prisma.sequenciaNumeracao.findUnique({
      where: {
        colegioId_escopo_ano: { colegioId: colegio.id, escopo: "OCORRENCIA", ano },
      },
    });
    expect(linha?.valor).toBe(N);
  });

  it("escopos e anos diferentes tem contadores independentes", async () => {
    const colegio = await criarColegio();
    const a = await prisma.$transaction((tx) =>
      proximoNumero(tx, colegio.id, "DECISAO", 2026),
    );
    const b = await prisma.$transaction((tx) =>
      proximoNumero(tx, colegio.id, "SANCAO", 2026),
    );
    const c = await prisma.$transaction((tx) =>
      proximoNumero(tx, colegio.id, "DECISAO", 2027),
    );
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(c).toBe(1);
  });
});
