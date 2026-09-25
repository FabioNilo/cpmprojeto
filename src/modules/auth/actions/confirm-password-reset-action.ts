"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/db/prisma";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { hashPassword } from "@/lib/security/password";
import { hashToken } from "@/lib/security/token";
import { registerAudit } from "@/modules/auditoria/services/audit-service";

import { confirmPasswordResetSchema } from "../schemas/password-reset-schema";
import { revogarSessoesDoUsuario } from "../services/session-service";

export type ConfirmResetState = {
  error?: string;
};

export async function confirmPasswordResetAction(
  _previousState: ConfirmResetState,
  formData: FormData,
): Promise<ConfirmResetState> {
  const parsed = confirmPasswordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    };
  }

  const metadata = await getRequestMetadata();
  const tokenHash = hashToken(parsed.data.token);

  try {
    await prisma.$transaction(async (tx) => {
      const registro = await tx.tokenRecuperacaoSenha.findUnique({
        where: { tokenHash },
        include: { usuario: { select: { id: true, ativo: true } } },
      });

      if (
        !registro ||
        registro.usedAt ||
        registro.expiresAt.getTime() <= Date.now() ||
        !registro.usuario.ativo
      ) {
        throw new Error("TOKEN_INVALIDO");
      }

      await tx.usuario.update({
        where: { id: registro.usuarioId },
        data: { passwordHash: await hashPassword(parsed.data.password) },
      });

      await tx.tokenRecuperacaoSenha.update({
        where: { id: registro.id },
        data: { usedAt: new Date() },
      });

      await tx.tokenRecuperacaoSenha.updateMany({
        where: {
          usuarioId: registro.usuarioId,
          usedAt: null,
          id: { not: registro.id },
        },
        data: { usedAt: new Date() },
      });

      await revogarSessoesDoUsuario(tx, registro.usuarioId);

      await registerAudit(
        {
          usuarioId: registro.usuarioId,
          acao: "RESET_SENHA_CONCLUIDO",
          entidade: "usuarios",
          entidadeId: registro.usuarioId,
          metadata,
        },
        tx,
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "TOKEN_INVALIDO") {
      return { error: "Link inválido ou expirado. Solicite um novo." };
    }

    return { error: "Não foi possível redefinir a senha." };
  }

  redirect("/login?reset=ok");
}
