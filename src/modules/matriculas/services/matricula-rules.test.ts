import { describe, expect, it } from "vitest";

import {
  avaliarMatricula,
  avaliarTransferenciaTurma,
} from "./matricula-rules";

const baseMatricula = {
  vinculoStatus: "ATIVO" as const,
  anoLetivoAtivo: true,
  turmaAtiva: true,
  turmaAnoLetivoId: "ano-1",
  anoLetivoId: "ano-1",
  turmaColegioId: "colegio-1",
  colegioId: "colegio-1",
};

describe("avaliarMatricula", () => {
  it("aceita quando vinculo ativo, ano aberto e turma coerente", () => {
    expect(avaliarMatricula(baseMatricula)).toEqual({ ok: true });
  });

  it("recusa aluno sem vinculo ativo no colegio", () => {
    expect(
      avaliarMatricula({ ...baseMatricula, vinculoStatus: "TRANSFERIDO" }),
    ).toEqual({ ok: false, motivo: "ALUNO_SEM_VINCULO_ATIVO" });
    expect(
      avaliarMatricula({ ...baseMatricula, vinculoStatus: null }),
    ).toEqual({ ok: false, motivo: "ALUNO_SEM_VINCULO_ATIVO" });
  });

  it("recusa ano letivo inativo e turma inativa", () => {
    expect(
      avaliarMatricula({ ...baseMatricula, anoLetivoAtivo: false }),
    ).toEqual({ ok: false, motivo: "ANO_LETIVO_INATIVO" });
    expect(avaliarMatricula({ ...baseMatricula, turmaAtiva: false })).toEqual({
      ok: false,
      motivo: "TURMA_INATIVA",
    });
  });

  it("recusa turma de outro colegio ou de outro ano letivo", () => {
    expect(
      avaliarMatricula({ ...baseMatricula, turmaColegioId: "colegio-2" }),
    ).toEqual({ ok: false, motivo: "TURMA_DE_OUTRO_COLEGIO" });
    expect(
      avaliarMatricula({ ...baseMatricula, turmaAnoLetivoId: "ano-2" }),
    ).toEqual({ ok: false, motivo: "TURMA_DE_OUTRO_ANO" });
  });
});

describe("avaliarTransferenciaTurma", () => {
  const base = {
    matriculaAtiva: true,
    turmaAtiva: true,
    turmaAnoLetivoId: "ano-1",
    matriculaAnoLetivoId: "ano-1",
    turmaColegioId: "colegio-1",
    colegioId: "colegio-1",
  };

  it("aceita troca de turma dentro do mesmo ano e colegio", () => {
    expect(avaliarTransferenciaTurma(base)).toEqual({ ok: true });
  });

  it("recusa matricula inativa e mudanca de ano letivo", () => {
    expect(
      avaliarTransferenciaTurma({ ...base, matriculaAtiva: false }),
    ).toEqual({ ok: false, motivo: "MATRICULA_INATIVA" });
    expect(
      avaliarTransferenciaTurma({ ...base, turmaAnoLetivoId: "ano-2" }),
    ).toEqual({ ok: false, motivo: "TURMA_DE_OUTRO_ANO" });
  });
});
