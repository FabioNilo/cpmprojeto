"use server";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { hashPassword, verifyPassword } from "@/lib/security/password";
import { registerAudit } from "@/modules/auditoria/services/audit-service";

import { changePasswordSchema } from "../schemas/password-reset-schema";
import {
  requireSession,
  revogarSessoesDoUsuario,
} from "../services/session-service";

export async function changePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const parsed = changePasswordSchema.safeParse({
    senhaAtual: formData.get("senhaAtual"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });

  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    );
  }

  const usuario = await prisma.usuario.findUnique({
    where: { id: session.usuarioId },
    select: { id: true, passwordHash: true },
  });

  if (
    !usuario ||
    !(await verifyPassword(parsed.data.senhaAtual, usuario.passwordHash))
  ) {
    return actionError("Senha atual incorreta.");
  }

  const metadata = await getRequestMetadata();

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash: await hashPassword(parsed.data.novaSenha) },
    });

    await revogarSessoesDoUsuario(tx, usuario.id, session.id);

    await registerAudit(
      {
        usuarioId: usuario.id,
        acao: "ALTERACAO_SENHA",
        entidade: "usuarios",
        entidadeId: usuario.id,
        metadata,
      },
      tx,
    );
  });

  return actionSuccess(
    "Senha alterada. As demais sessões foram encerradas.",
  );
}
