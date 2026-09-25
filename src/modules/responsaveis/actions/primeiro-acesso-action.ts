"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/db/prisma";
import {
  actionError,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { hashPassword } from "@/lib/security/password";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import {
  requireSession,
  revogarSessoesDoUsuario,
} from "@/modules/auth/services/session-service";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

import { TERMO_RESPONSAVEL_VERSAO } from "../termo";

const schema = z
  .object({
    aceite: z.literal("on", {
      errorMap: () => ({ message: "É necessário aceitar o termo." }),
    }),
    novaSenha: z.string().min(8, "Mínimo de 8 caracteres.").max(128),
    confirmarSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  });

export async function concluirPrimeiroAcessoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await getTenantContext();
  if (!context.ehResponsavel) {
    redirect("/dashboard");
  }
  if (!context.onboardingPendente) {
    redirect("/meus-filhos");
  }

  const parsed = schema.safeParse({
    aceite: formData.get("aceite"),
    novaSenha: formData.get("novaSenha"),
    confirmarSenha: formData.get("confirmarSenha"),
  });
  if (!parsed.success) {
    return actionError(
      parsed.error.issues[0]?.message ?? "Confira os dados informados.",
    );
  }

  const session = await requireSession();
  const metadata = await getRequestMetadata();
  const passwordHash = await hashPassword(parsed.data.novaSenha);

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: context.usuarioId },
      data: {
        passwordHash,
        mudarSenhaObrigatoria: false,
        termoResponsavelAceitoEm: new Date(),
        termoResponsavelVersao: TERMO_RESPONSAVEL_VERSAO,
      },
    });
    // Encerra outras sessoes (mantem a atual).
    await revogarSessoesDoUsuario(tx, context.usuarioId, session.id);

    await registerAudit(
      {
        usuarioId: context.usuarioId,
        colegioId: context.colegioId,
        acao: "ACEITE_TERMO_RESPONSAVEL",
        entidade: "usuarios",
        entidadeId: context.usuarioId,
        dadosNovos: { termoVersao: TERMO_RESPONSAVEL_VERSAO },
        metadata,
      },
      tx,
    );
    await registerAudit(
      {
        usuarioId: context.usuarioId,
        colegioId: context.colegioId,
        acao: "ALTERACAO_SENHA",
        entidade: "usuarios",
        entidadeId: context.usuarioId,
        metadata,
      },
      tx,
    );
  });

  redirect("/meus-filhos");
}
