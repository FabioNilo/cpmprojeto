import { describe, expect, it } from "vitest";

import { prisma } from "@/db/prisma";
import {
  gravarNumerosProcessos,
  proximoNumero,
  proximosNumeros,
} from "@/modules/disciplina/services/numeracao-service";

import {
  criarColegio,
  criarPerfil,
  criarUsuarioComPerfil,
} from "./helpers/factories";

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

  it("reserva em bloco devolve faixas consecutivas sem sobreposicao", async () => {
    const colegio = await criarColegio();
    const ano = 2026;

    // Primeiro uso cria a linha ja com o bloco inteiro.
    const primeiro = await prisma.$transaction((tx) =>
      proximosNumeros(tx, colegio.id, "OCORRENCIA", ano, 5),
    );
    expect(primeiro).toEqual([1, 2, 3, 4, 5]);

    // Mistura com a alocacao unitaria e blocos em paralelo.
    const unitario = await prisma.$transaction((tx) =>
      proximoNumero(tx, colegio.id, "OCORRENCIA", ano),
    );
    expect(unitario).toBe(6);

    const paralelos = await Promise.all(
      [3, 4, 2].map((qtd) =>
        prisma.$transaction((tx) =>
          proximosNumeros(tx, colegio.id, "OCORRENCIA", ano, qtd),
        ),
      ),
    );
    const todos = [...primeiro, unitario, ...paralelos.flat()];
    expect(new Set(todos).size).toBe(todos.length);
    expect(Math.max(...todos)).toBe(15);
    for (const bloco of paralelos) {
      bloco.forEach((n, i) => i > 0 && expect(n).toBe(bloco[i - 1] + 1));
    }

    const vazio = await prisma.$transaction((tx) =>
      proximosNumeros(tx, colegio.id, "OCORRENCIA", ano, 0),
    );
    expect(vazio).toEqual([]);
  });

  it("grava o numero de varios processos numa so instrucao", async () => {
    const colegio = await criarColegio();
    const perfil = await criarPerfil(`PERFIL-${Date.now()}`);
    const { usuario } = await criarUsuarioComPerfil({
      colegioId: colegio.id,
      perfilId: perfil.id,
    });
    const ocorrencia = await prisma.ocorrencia.create({
      data: {
        colegioId: colegio.id,
        comunicanteId: usuario.id,
        dataOcorrencia: new Date(),
        descricao: "Fato de teste para numeracao em lote.",
      },
    });
    const processos: Array<{ id: string }> = [];
    for (let i = 0; i < 5; i += 1) {
      const aluno = await prisma.aluno.create({ data: { nome: `Aluno Lote ${i}` } });
      processos.push(
        await prisma.ocorrenciaAluno.create({
          data: { ocorrenciaId: ocorrencia.id, alunoId: aluno.id, ordem: i + 1 },
        }),
      );
    }

    await prisma.$transaction((tx) =>
      gravarNumerosProcessos(
        tx,
        2026,
        processos.map((p, i) => ({
          id: p.id,
          numeroProcesso: `T-2026-${100 + i}`,
          numeroSequencial: 100 + i,
        })),
      ),
    );

    const gravados = await prisma.ocorrenciaAluno.findMany({
      where: { ocorrenciaId: ocorrencia.id },
      orderBy: { ordem: "asc" },
      select: { numeroProcesso: true, numeroSequencial: true, anoNumeracao: true },
    });
    expect(gravados).toEqual(
      processos.map((_, i) => ({
        numeroProcesso: `T-2026-${100 + i}`,
        numeroSequencial: 100 + i,
        anoNumeracao: 2026,
      })),
    );
  });
});
