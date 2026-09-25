export type StatusVinculo = "ATIVO" | "TRANSFERIDO" | "ENCERRADO";

export type MotivoRecusaMatricula =
  | "ALUNO_SEM_VINCULO_ATIVO"
  | "ANO_LETIVO_INATIVO"
  | "TURMA_INATIVA"
  | "TURMA_DE_OUTRO_ANO"
  | "TURMA_DE_OUTRO_COLEGIO";

export type ResultadoRegra =
  | { ok: true }
  | { ok: false; motivo: MotivoRecusaMatricula };

type ContextoMatricula = {
  vinculoStatus: StatusVinculo | null;
  anoLetivoAtivo: boolean;
  turmaAtiva: boolean;
  turmaAnoLetivoId: string;
  anoLetivoId: string;
  turmaColegioId: string;
  colegioId: string;
};

export function avaliarMatricula(ctx: ContextoMatricula): ResultadoRegra {
  if (ctx.vinculoStatus !== "ATIVO") {
    return { ok: false, motivo: "ALUNO_SEM_VINCULO_ATIVO" };
  }
  if (!ctx.anoLetivoAtivo) {
    return { ok: false, motivo: "ANO_LETIVO_INATIVO" };
  }
  if (!ctx.turmaAtiva) {
    return { ok: false, motivo: "TURMA_INATIVA" };
  }
  if (ctx.turmaColegioId !== ctx.colegioId) {
    return { ok: false, motivo: "TURMA_DE_OUTRO_COLEGIO" };
  }
  if (ctx.turmaAnoLetivoId !== ctx.anoLetivoId) {
    return { ok: false, motivo: "TURMA_DE_OUTRO_ANO" };
  }

  return { ok: true };
}

type ContextoTransferenciaTurma = {
  matriculaAtiva: boolean;
  turmaAtiva: boolean;
  turmaAnoLetivoId: string;
  matriculaAnoLetivoId: string;
  turmaColegioId: string;
  colegioId: string;
};

export type MotivoRecusaTransferencia =
  | "MATRICULA_INATIVA"
  | "TURMA_INATIVA"
  | "TURMA_DE_OUTRO_ANO"
  | "TURMA_DE_OUTRO_COLEGIO";

export function avaliarTransferenciaTurma(
  ctx: ContextoTransferenciaTurma,
): { ok: true } | { ok: false; motivo: MotivoRecusaTransferencia } {
  if (!ctx.matriculaAtiva) {
    return { ok: false, motivo: "MATRICULA_INATIVA" };
  }
  if (!ctx.turmaAtiva) {
    return { ok: false, motivo: "TURMA_INATIVA" };
  }
  if (ctx.turmaColegioId !== ctx.colegioId) {
    return { ok: false, motivo: "TURMA_DE_OUTRO_COLEGIO" };
  }
  if (ctx.turmaAnoLetivoId !== ctx.matriculaAnoLetivoId) {
    return { ok: false, motivo: "TURMA_DE_OUTRO_ANO" };
  }

  return { ok: true };
}
