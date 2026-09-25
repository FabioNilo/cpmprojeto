import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/db/prisma";
import type { RequestMetadata } from "@/lib/http/request-metadata";
import { createSessionToken, hashToken } from "@/lib/security/token";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "cpm_session";

const SESSION_DAYS = 8;
const REMEMBER_SESSION_DAYS = 30;

const sessionInclude = {
  usuario: true,
  colegioAtivo: true,
} satisfies Prisma.SessaoInclude;

export type AuthSession = Prisma.SessaoGetPayload<{
  include: typeof sessionInclude;
}>;

type SessionDb = Prisma.TransactionClient | PrismaClient;

export type SessionCredentials = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

export function buildSessionCredentials(
  remember?: boolean,
): SessionCredentials {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const days = remember ? REMEMBER_SESSION_DAYS : SESSION_DAYS;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  return { token, tokenHash, expiresAt };
}

export async function persistSession(
  db: SessionDb,
  input: {
    usuarioId: string;
    colegioAtivoId: string;
    tokenHash: string;
    expiresAt: Date;
    metadata?: RequestMetadata;
  },
): Promise<void> {
  await db.sessao.create({
    data: {
      usuarioId: input.usuarioId,
      colegioAtivoId: input.colegioAtivoId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      ip: input.metadata?.ip,
      userAgent: input.metadata?.userAgent,
    },
  });
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(input: {
  usuarioId: string;
  colegioAtivoId: string;
  remember?: boolean;
  metadata?: RequestMetadata;
}): Promise<string> {
  const credentials = buildSessionCredentials(input.remember);

  await persistSession(prisma, {
    usuarioId: input.usuarioId,
    colegioAtivoId: input.colegioAtivoId,
    tokenHash: credentials.tokenHash,
    expiresAt: credentials.expiresAt,
    metadata: input.metadata,
  });

  await setSessionCookie(credentials.token, credentials.expiresAt);

  return credentials.token;
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.sessao.findUnique({
    where: { tokenHash: hashToken(token) },
    include: sessionInclude,
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.usuario.ativo ||
    !session.colegioAtivo.ativo
  ) {
    return null;
  }

  return session;
}

export async function destroyCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.sessao.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

// Encerra todas as sessoes ativas do usuario (opcionalmente exceto uma).
// Usado ao redefinir/alterar senha.
export async function revogarSessoesDoUsuario(
  db: SessionDb,
  usuarioId: string,
  excetoSessaoId?: string,
): Promise<void> {
  await db.sessao.updateMany({
    where: {
      usuarioId,
      revokedAt: null,
      ...(excetoSessaoId ? { id: { not: excetoSessaoId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
}
