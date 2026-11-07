// Regras do monitor do banco. Sem acesso a banco nem a variaveis de ambiente,
// para poder ser testado. O resultado alimenta /api/saude.

export type Medidas = {
  latenciaMs: number;
  // Projeto Supabase inteiro: o limite do plano vale para todos os schemas.
  bancoMb: number;
  schemaMb: number;
  conexoesEmUso: number;
  conexoesMax: number;
};

export type Limites = {
  limiteBancoMb: number;
  tamanhoAtencaoPercentual: number;
  tamanhoCriticoPercentual: number;
  conexoesAtencaoPercentual: number;
  conexoesCriticoPercentual: number;
  latenciaAtencaoMs: number;
  latenciaCriticaMs: number;
};

// Plano Free do Supabase: 500 MB de banco. Troque em MONITOR_LIMITE_BANCO_MB.
export const LIMITES_PADRAO: Limites = {
  limiteBancoMb: 500,
  tamanhoAtencaoPercentual: 70,
  tamanhoCriticoPercentual: 90,
  conexoesAtencaoPercentual: 80,
  conexoesCriticoPercentual: 95,
  latenciaAtencaoMs: 1500,
  latenciaCriticaMs: 5000,
};

export type CodigoAlerta =
  | "BANCO_FORA"
  | "BANCO_LENTO"
  | "TAMANHO_ALTO"
  | "CONEXOES_ALTAS";

export type NivelAlerta = "ATENCAO" | "CRITICO";

export type Alerta = { codigo: CodigoAlerta; nivel: NivelAlerta };

export type Situacao = "ok" | "atencao" | "critico";

export type Avaliacao = { status: Situacao; alertas: Alerta[] };

function numeroPositivo(valor: string | undefined, padrao: number): number {
  const numero = Number(valor);
  return valor !== undefined && valor.trim() !== "" && Number.isFinite(numero) && numero > 0
    ? numero
    : padrao;
}

// Valor ausente, vazio ou invalido volta ao padrao, sem derrubar o monitor.
export function lerLimites(
  env: Record<string, string | undefined>,
): Limites {
  return {
    ...LIMITES_PADRAO,
    limiteBancoMb: numeroPositivo(
      env.MONITOR_LIMITE_BANCO_MB,
      LIMITES_PADRAO.limiteBancoMb,
    ),
  };
}

function nivelPorPercentual(
  valor: number,
  atencao: number,
  critico: number,
): NivelAlerta | null {
  if (valor >= critico) {
    return "CRITICO";
  }
  return valor >= atencao ? "ATENCAO" : null;
}

const GRAVIDADE: Record<Situacao, number> = { ok: 0, atencao: 1, critico: 2 };

export function avaliarSaude(
  medidas: Medidas | null,
  limites: Limites = LIMITES_PADRAO,
): Avaliacao {
  // Sem medida, o banco nao respondeu: pausado, fora do ar ou inalcancavel.
  if (medidas === null) {
    return {
      status: "critico",
      alertas: [{ codigo: "BANCO_FORA", nivel: "CRITICO" }],
    };
  }

  const alertas: Alerta[] = [];

  const nivelTamanho = nivelPorPercentual(
    (medidas.bancoMb / limites.limiteBancoMb) * 100,
    limites.tamanhoAtencaoPercentual,
    limites.tamanhoCriticoPercentual,
  );
  if (nivelTamanho) {
    alertas.push({ codigo: "TAMANHO_ALTO", nivel: nivelTamanho });
  }

  if (medidas.conexoesMax > 0) {
    const nivelConexoes = nivelPorPercentual(
      (medidas.conexoesEmUso / medidas.conexoesMax) * 100,
      limites.conexoesAtencaoPercentual,
      limites.conexoesCriticoPercentual,
    );
    if (nivelConexoes) {
      alertas.push({ codigo: "CONEXOES_ALTAS", nivel: nivelConexoes });
    }
  }

  const nivelLatencia = nivelPorPercentual(
    medidas.latenciaMs,
    limites.latenciaAtencaoMs,
    limites.latenciaCriticaMs,
  );
  if (nivelLatencia) {
    alertas.push({ codigo: "BANCO_LENTO", nivel: nivelLatencia });
  }

  const status = alertas.reduce<Situacao>((pior, alerta) => {
    const atual: Situacao = alerta.nivel === "CRITICO" ? "critico" : "atencao";
    return GRAVIDADE[atual] > GRAVIDADE[pior] ? atual : pior;
  }, "ok");

  return { status, alertas };
}
