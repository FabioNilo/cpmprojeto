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
