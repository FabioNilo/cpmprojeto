import "server-only";

import type { Prisma } from "@prisma/client";

export type EscopoNumeracao =
  | "OCORRENCIA"
  | "DECISAO"
  | "SANCAO"
  | "SINDICANCIA"
  | "CONSELHO"
  | "RECONSIDERACAO"
  | "ELOGIO";

// Alocacao atomica e concorrente-segura de numero sequencial.
//
// `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` e uma unica instrucao: o
// Postgres pega o lock da linha (colegio, escopo, ano), incrementa e devolve o
// novo valor. Dois envios simultaneos (pessoas diferentes, mesmo horario)
// serializam nesse lock e recebem numeros distintos - nunca o mesmo.
//
// Deve ser chamado dentro de um prisma.$transaction para que o numero seja
// "devolvido" se o restante da operacao falhar (o rollback desfaz o incremento).
export async function proximoNumero(
  tx: Prisma.TransactionClient,
  colegioId: string,
  escopo: EscopoNumeracao,
  ano: number,
): Promise<number> {
  const linhas = await tx.$queryRaw<Array<{ valor: number | bigint }>>`
    INSERT INTO "sequencias_numeracao" ("colegio_id", "escopo", "ano", "valor", "updated_at")
    VALUES (${colegioId}::uuid, ${escopo}, ${ano}, 1, now())
    ON CONFLICT ("colegio_id", "escopo", "ano")
    DO UPDATE SET "valor" = "sequencias_numeracao"."valor" + 1, "updated_at" = now()
    RETURNING "valor"
  `;
  return Number(linhas[0].valor);
}

// Reserva `quantidade` numeros consecutivos numa UNICA instrucao (mesmo lock
// de linha de `proximoNumero`) e devolve-os em ordem. Evita uma ida ao banco
// por aluno quando uma comunicacao com varios alunos e enviada.
export async function proximosNumeros(
  tx: Prisma.TransactionClient,
  colegioId: string,
  escopo: EscopoNumeracao,
  ano: number,
  quantidade: number,
): Promise<number[]> {
  if (quantidade < 1) {
    return [];
  }
  const linhas = await tx.$queryRaw<Array<{ valor: number | bigint }>>`
    INSERT INTO "sequencias_numeracao" ("colegio_id", "escopo", "ano", "valor", "updated_at")
    VALUES (${colegioId}::uuid, ${escopo}, ${ano}, ${quantidade}, now())
    ON CONFLICT ("colegio_id", "escopo", "ano")
    DO UPDATE SET "valor" = "sequencias_numeracao"."valor" + ${quantidade}, "updated_at" = now()
    RETURNING "valor"
  `;
  const ultimo = Number(linhas[0].valor);
  const primeiro = ultimo - quantidade + 1;
  return Array.from({ length: quantidade }, (_, i) => primeiro + i);
}

// Grava o numero oficial de varios processos (ocorrencia_alunos) numa unica
// instrucao, em vez de um UPDATE por aluno.
export async function gravarNumerosProcessos(
  tx: Prisma.TransactionClient,
  ano: number,
  itens: Array<{ id: string; numeroProcesso: string; numeroSequencial: number }>,
): Promise<void> {
  if (itens.length === 0) {
    return;
  }
  await tx.$executeRaw`
    UPDATE "ocorrencia_alunos" AS oa
    SET "numero_processo" = v.numero,
        "numero_sequencial" = v.seq,
        "ano_numeracao" = ${ano},
        "updated_at" = now()
    FROM unnest(
      ${itens.map((i) => i.id)}::uuid[],
      ${itens.map((i) => i.numeroProcesso)}::text[],
      ${itens.map((i) => i.numeroSequencial)}::int[]
    ) AS v(id, numero, seq)
    WHERE oa."id" = v.id
  `;
}
