import "server-only";

import { prisma } from "@/db/prisma";

import {
  avaliarSaude,
  lerLimites,
  type Avaliacao,
  type Limites,
  type Medidas,
} from "./avaliar-saude";

export type ResultadoSaude = Avaliacao & {
  medidas: Medidas | null;
  limites: Limites;
  medidoEm: string;
};

// A rota e publica: o resultado fica em memoria por 1 minuto, para que
// consultas repetidas nao virem carga no banco.
const VALIDADE_MS = 60_000;
const TEMPO_LIMITE_MS = 8_000;
const BYTES_POR_MB = 1024 * 1024;

let guardado: { medidoEm: number; resultado: ResultadoSaude } | null = null;
let emAndamento: Promise<ResultadoSaude> | null = null;

type LinhaMedida = {
  banco: number;
  schema: number;
  em_uso: number;
  maximo: number;
};

async function consultar(): Promise<{ linha: LinhaMedida; latenciaMs: number }> {
  // Garante a conexao aberta antes de medir. Sem isso, a primeira consulta
  // depois de o app iniciar (ou de a conexao cair) incluiria o tempo de
  // conectar ao Supabase e pareceria um banco lento.
  await prisma.$queryRaw`SELECT 1`;

  const inicio = performance.now();
  const linhas = await prisma.$queryRaw<LinhaMedida[]>`
    SELECT
      pg_database_size(current_database())::float8 AS banco,
      (
        SELECT COALESCE(SUM(pg_total_relation_size(c.oid)), 0)::float8
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = current_schema() AND c.relkind IN ('r', 'm', 't')
      ) AS schema,
      (SELECT count(*)::int FROM pg_stat_activity) AS em_uso,
      (
        SELECT setting::int FROM pg_settings WHERE name = 'max_connections'
      ) AS maximo
  `;
  return {
    linha: linhas[0],
    latenciaMs: Math.round(performance.now() - inicio),
  };
}

async function medir(): Promise<Medidas | null> {
  try {
    // O tempo limite vale para tudo, inclusive para abrir a conexao.
    const { linha, latenciaMs } = await Promise.race([
      consultar(),
      new Promise<never>((_, rejeitar) =>
        setTimeout(() => rejeitar(new Error("tempo esgotado")), TEMPO_LIMITE_MS),
      ),
    ]);
    return {
      latenciaMs,
      bancoMb: Math.round((linha.banco / BYTES_POR_MB) * 10) / 10,
      schemaMb: Math.round((linha.schema / BYTES_POR_MB) * 10) / 10,
      conexoesEmUso: linha.em_uso,
      conexoesMax: linha.maximo,
    };
  } catch {
    return null;
  }
}

async function medirEAvaliar(): Promise<ResultadoSaude> {
  const limites = lerLimites(process.env);
  const medidas = await medir();
  return {
    ...avaliarSaude(medidas, limites),
    medidas,
    limites,
    medidoEm: new Date().toISOString(),
  };
}

export async function obterSaude(agora = Date.now()): Promise<ResultadoSaude> {
  if (guardado && agora - guardado.medidoEm < VALIDADE_MS) {
    return guardado.resultado;
  }
  // Pedidos simultaneos esperam a mesma medicao.
  emAndamento ??= medirEAvaliar()
    .then((resultado) => {
      guardado = { medidoEm: Date.now(), resultado };
      return resultado;
    })
    .finally(() => {
      emAndamento = null;
    });
  return emAndamento;
}
