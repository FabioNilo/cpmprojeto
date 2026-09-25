import { prisma } from "@/db/prisma";
import type { RequestMetadata } from "@/lib/http/request-metadata";
import type { Prisma, PrismaClient } from "@prisma/client";

type AuditDb = Prisma.TransactionClient | PrismaClient;

type AuditInput = {
  usuarioId?: string;
  colegioId?: string;
  acao: string;
  entidade?: string;
  entidadeId?: string;
  dadosAnteriores?: Prisma.InputJsonValue;
  dadosNovos?: Prisma.InputJsonValue;
  metadata?: RequestMetadata;
};

export async function registerAudit(
  input: AuditInput,
  db: AuditDb = prisma,
): Promise<void> {
  await db.auditoria.create({
    data: {
      usuarioId: input.usuarioId,
      colegioId: input.colegioId,
      acao: input.acao,
      entidade: input.entidade,
      entidadeId: input.entidadeId,
      dadosAnteriores: input.dadosAnteriores,
      dadosNovos: input.dadosNovos,
      ip: input.metadata?.ip,
      userAgent: input.metadata?.userAgent,
    },
  });
}
