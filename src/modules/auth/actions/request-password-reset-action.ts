"use server";

import { prisma } from "@/db/prisma";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";

import { requestPasswordResetSchema } from "../schemas/password-reset-schema";

export type RequestResetState = {
  enviado: boolean;
  mensagem?: string;
};

// Mensagem unica para todos os casos: nao revela se a conta existe.
const MENSAGEM_GENERICA =
  "Pedido registrado. Se os dados informados existirem em nosso sistema, a administração do colégio entrará em contato com um link temporário para definir uma nova senha. Aguarde o contato.";

// Este fluxo e publico e NUNCA cria token: so registra o pedido na fila de quem
// atende. O link temporario e gerado depois por um gestor autenticado.
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
      responsavel: { select: { id: true } },
      colegios: {
        where: { ativo: true, colegio: { ativo: true } },
        orderBy: { createdAt: "asc" },
        select: { colegioId: true },
        take: 1,
      },
    },
  });

  const colegioId = usuario?.colegios[0]?.colegioId;
  if (usuario && colegioId) {
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
        acao: usuario.responsavel
          ? "SOLICITACAO_SENHA_RESPONSAVEL"
          : "SOLICITACAO_RESET_SENHA",
        entidade: "solicitacoes_senha_responsavel",
        entidadeId: solicitacao.id,
        metadata,
      });
    }
  }

  return { enviado: true, mensagem: MENSAGEM_GENERICA };
}
