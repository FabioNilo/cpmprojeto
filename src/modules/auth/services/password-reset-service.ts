import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/db/prisma";
import type { RequestMetadata } from "@/lib/http/request-metadata";
import { createSessionToken, hashToken } from "@/lib/security/token";

import {
  expiracaoLinkTemporario,
  tokenRecuperacaoVigente,
} from "./link-temporario-rules";

// Cria o token do link temporario e cancela os anteriores do mesmo usuario.
// Grave so o hash: o token puro volta apenas para quem gerou o link.
export async function criarTokenRecuperacao(
  usuarioId: string,
  metadata?: RequestMetadata,
  db: Prisma.TransactionClient | PrismaClient = prisma,
): Promise<{ token: string; expiresAt: Date }> {
  const agora = new Date();
  const token = createSessionToken();
  const expiresAt = expiracaoLinkTemporario(agora);

  await db.tokenRecuperacaoSenha.updateMany({
    where: { usuarioId, usedAt: null },
    data: { usedAt: agora },
  });

  await db.tokenRecuperacaoSenha.create({
    data: {
      usuarioId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
    },
  });

  return { token, expiresAt };
}

export async function validarTokenRecuperacao(token: string) {
  const registro = await prisma.tokenRecuperacaoSenha.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { select: { id: true, ativo: true } } },
  });

  if (!registro || !tokenRecuperacaoVigente(registro, new Date())) {
    return null;
  }

  return registro;
}
