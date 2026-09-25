"use server";

import { prisma } from "@/db/prisma";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { mailer } from "@/lib/mail/mailer";
import { registerAudit } from "@/modules/auditoria/services/audit-service";

import { requestPasswordResetSchema } from "../schemas/password-reset-schema";
import { criarTokenRecuperacao } from "../services/password-reset-service";

export type RequestResetState = {
  enviado: boolean;
  mensagem?: string;
};

// Mensagem unica para os dois caminhos (e-mail ou sinalizacao ao colegio):
// nao revela se o usuario existe nem qual caminho foi seguido.
const MENSAGEM_GENERICA =
  "Se os dados informados existirem em nosso sistema, você receberá as instruções por e-mail ou a administração do colégio entrará em contato com uma nova senha.";

export async function requestPasswordResetAction(
  _previousState: RequestResetState,
  formData: FormData,
): Promise<RequestResetState> {
  const parsed = requestPasswordResetSchema.safeParse({
    identifier: formData.get("identifier"),
  });

  if (!parsed.success) {
    return { enviado: true, mensagem: MENSAGEM_GENERICA };
  }

  const metadata = await getRequestMetadata();
  const identifier = parsed.data.identifier.trim().toLowerCase();
  const cpf = identifier.replace(/\D/g, "");

  const usuario = await prisma.usuario.findFirst({
    where: {
      ativo: true,
      OR: [
        { username: identifier },
        { email: identifier },
        ...(cpf.length === 11 ? [{ cpf }] : []),
      ],
    },
    select: {
      id: true,
      nome: true,
      email: true,
      responsavel: { select: { id: true } },
      colegios: {
        where: { ativo: true, colegio: { ativo: true } },
        orderBy: { createdAt: "asc" },
        select: { colegioId: true },
        take: 1,
      },
    },
  });

  if (usuario?.responsavel) {
    // Responsavel nao tem e-mail/SMTP configurado: sinaliza para quem
    // administra responsaveis no colegio (Chefe do Corpo de Alunos,
    // Diretor-Adjunto, Diretor PM, Admin) atender manualmente.
    const colegioId = usuario.colegios[0]?.colegioId;
    if (colegioId) {
      const jaPendente = await prisma.solicitacaoSenhaResponsavel.findFirst({
        where: { usuarioId: usuario.id, atendidaEm: null },
        select: { id: true },
      });

      if (!jaPendente) {
        const solicitacao = await prisma.solicitacaoSenhaResponsavel.create({
          data: { usuarioId: usuario.id, colegioId },
        });

        await registerAudit({
          usuarioId: usuario.id,
          colegioId,
          acao: "SOLICITACAO_SENHA_RESPONSAVEL",
          entidade: "solicitacoes_senha_responsavel",
          entidadeId: solicitacao.id,
          metadata,
        });
      }
    }
  } else if (usuario) {
    const token = await criarTokenRecuperacao(usuario.id, metadata);

    await registerAudit({
      usuarioId: usuario.id,
      acao: "SOLICITACAO_RESET_SENHA",
      entidade: "usuarios",
      entidadeId: usuario.id,
      metadata,
    });

    if (usuario.email) {
      await mailer.send({
        to: usuario.email,
        subject: "Recuperação de senha - Sistema Disciplinar CPM",
        text: [
          `Olá ${usuario.nome},`,
          "",
          "Use o link abaixo para definir uma nova senha (válido por 30 minutos):",
          `/reset-password?token=${token}`,
          "",
          "Se você não solicitou, ignore este email.",
        ].join("\n"),
      });
    }
  }

  return { enviado: true, mensagem: MENSAGEM_GENERICA };
}
