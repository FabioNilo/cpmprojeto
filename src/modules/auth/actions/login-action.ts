"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { verifyPassword } from "@/lib/security/password";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { loginSchema } from "@/modules/auth/schemas/login-schema";
import {
  avaliarBloqueioLogin,
  registrarTentativaLogin,
} from "@/modules/auth/services/login-throttle-service";
import {
  buildSessionCredentials,
  persistSession,
  setSessionCookie,
} from "@/modules/auth/services/session-service";

export type LoginState = {
  error?: string;
};

const GENERIC_LOGIN_ERROR = "CPF/usuário ou senha inválidos.";
const BLOQUEIO_LOGIN_ERROR =
  "Muitas tentativas de acesso. Aguarde alguns minutos e tente novamente.";

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    remember: formData.get("remember") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Confira os dados informados." };
  }

  const metadata = await getRequestMetadata();
  const identifier = normalizeIdentifier(parsed.data.identifier);
  const cpfOnlyNumbers = identifier.replace(/\D/g, "");

  const bloqueio = await avaliarBloqueioLogin({
    identificador: identifier,
    ip: metadata.ip,
  });

  if (bloqueio.bloqueado) {
    await registerAudit({
      acao: "LOGIN_BLOQUEADO",
      entidade: "usuarios",
      entidadeId: identifier,
      dadosNovos: { motivo: bloqueio.motivo },
      metadata,
    });
    return { error: BLOQUEIO_LOGIN_ERROR };
  }
  const identifierFilters: Prisma.UsuarioWhereInput[] = [
    { username: identifier },
    { email: identifier },
  ];

  if (cpfOnlyNumbers.length === 11) {
    identifierFilters.push({ cpf: cpfOnlyNumbers });
  }

  const usuario = await prisma.usuario.findFirst({
    where: {
      ativo: true,
      OR: identifierFilters,
    },
    include: {
      colegios: {
        where: { ativo: true, colegio: { ativo: true } },
        orderBy: { createdAt: "asc" },
        include: { colegio: true },
      },
    },
  });

  if (!usuario) {
    await registerAudit({
      acao: "LOGIN_FALHA",
      entidade: "usuarios",
      entidadeId: identifier,
      metadata,
    });
    await registrarTentativaLogin({
      identificador: identifier,
      sucesso: false,
      metadata,
    });
    return { error: GENERIC_LOGIN_ERROR };
  }

  const validPassword = await verifyPassword(
    parsed.data.password,
    usuario.passwordHash,
  );

  if (!validPassword || usuario.colegios.length === 0) {
    await registerAudit({
      usuarioId: usuario.id,
      acao: "LOGIN_FALHA",
      entidade: "usuarios",
      entidadeId: usuario.id,
      metadata,
    });
    await registrarTentativaLogin({
      identificador: identifier,
      sucesso: false,
      metadata,
    });
    return { error: GENERIC_LOGIN_ERROR };
  }

  const colegioAtivo = usuario.colegios[0].colegio;
  const credentials = buildSessionCredentials(parsed.data.remember === "on");

  await prisma.$transaction(async (tx) => {
    await persistSession(tx, {
      usuarioId: usuario.id,
      colegioAtivoId: colegioAtivo.id,
      tokenHash: credentials.tokenHash,
      expiresAt: credentials.expiresAt,
      metadata,
    });

    await tx.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    await registerAudit(
      {
        usuarioId: usuario.id,
        colegioId: colegioAtivo.id,
        acao: "LOGIN_SUCESSO",
        entidade: "usuarios",
        entidadeId: usuario.id,
        metadata,
      },
      tx,
    );

    await registrarTentativaLogin(
      {
        identificador: identifier,
        sucesso: true,
        metadata,
      },
      tx,
    );
  });

  await setSessionCookie(credentials.token, credentials.expiresAt);

  redirect("/dashboard");
}
