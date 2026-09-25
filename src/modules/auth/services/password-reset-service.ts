import "server-only";

import { prisma } from "@/db/prisma";
import type { RequestMetadata } from "@/lib/http/request-metadata";
import { createSessionToken, hashToken } from "@/lib/security/token";

export const RESET_TOKEN_TTL_MINUTOS = 30;

export async function criarTokenRecuperacao(
  usuarioId: string,
  metadata?: RequestMetadata,
): Promise<string> {
  const token = createSessionToken();

  await prisma.tokenRecuperacaoSenha.create({
    data: {
      usuarioId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTOS * 60 * 1000),
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
    },
  });

  return token;
}

export async function validarTokenRecuperacao(token: string) {
  const registro = await prisma.tokenRecuperacaoSenha.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { usuario: { select: { id: true, ativo: true } } },
  });

  if (
    !registro ||
    registro.usedAt ||
    registro.expiresAt.getTime() <= Date.now() ||
    !registro.usuario.ativo
  ) {
    return null;
  }

  return registro;
}
