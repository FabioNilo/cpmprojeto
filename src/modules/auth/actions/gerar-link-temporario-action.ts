"use server";

import { z } from "zod";

import { prisma } from "@/db/prisma";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  bloqueioLinkTemporario,
  type BloqueioLinkTemporario,
  type OrigemLinkTemporario,
} from "../services/link-temporario-rules";
import { criarTokenRecuperacao } from "../services/password-reset-service";

export type LinkTemporarioState = {
  status: "idle" | "success" | "error";
  message?: string;
  caminho?: string;
};

const gerarLinkSchema = z.object({ usuarioId: z.string().uuid() });

const MENSAGENS_BLOQUEIO: Record<BloqueioLinkTemporario, string> = {
  USUARIO_INATIVO: "Usuário inativo. Reative o cadastro antes de gerar o link.",
  SEM_VINCULO: "Usuário sem acesso ativo no colégio atual.",
  ADMINISTRADOR_PROTEGIDO: "Somente um administrador pode gerar este link.",
  NAO_RESPONSAVEL: "Esta conta não é de responsável.",
  CONTA_DE_EQUIPE:
    "Esta conta também é da equipe. O link deve ser gerado na tela de Usuários.",
  CONTA_DE_RESPONSAVEL:
    "Esta conta é de responsável. O link deve ser gerado na tela de Responsáveis.",
};

async function gerarLink(
  origem: OrigemLinkTemporario,
  context: { usuarioId: string; colegioId: string; perfis: string[] },
  formData: FormData,
): Promise<LinkTemporarioState> {
  const parsed = gerarLinkSchema.safeParse({
    usuarioId: formData.get("usuarioId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Usuário inválido." };
  }

  const alvo = await prisma.usuario.findUnique({
    where: { id: parsed.data.usuarioId },
    select: {
      id: true,
      ativo: true,
      responsavel: { select: { id: true } },
      colegios: {
        select: {
          colegioId: true,
          ativo: true,
          perfis: { select: { perfil: { select: { codigo: true } } } },
        },
      },
    },
  });
  const vinculoNoColegio = alvo?.colegios.find(
    (vinculo) => vinculo.colegioId === context.colegioId,
  );
  // Sem vinculo com o colegio ativo, a conta nem e revelada ao gestor.
  if (!alvo || !vinculoNoColegio) {
    return {
      status: "error",
      message: "Usuário sem acesso ativo no colégio atual.",
    };
  }

  const bloqueio = bloqueioLinkTemporario(origem, context.perfis, {
    ativo: alvo.ativo,
    vinculoAtivoNoColegio: vinculoNoColegio.ativo,
    ehResponsavel: alvo.responsavel !== null,
    perfis: alvo.colegios.flatMap((vinculo) =>
      vinculo.perfis.map((item) => item.perfil.codigo),
    ),
  });
  if (bloqueio) {
    return { status: "error", message: MENSAGENS_BLOQUEIO[bloqueio] };
  }

  try {
    const metadata = await getRequestMetadata();
    const token = await prisma.$transaction(async (tx) => {
      const gerado = await criarTokenRecuperacao(alvo.id, metadata, tx);
      const atendidas = await tx.solicitacaoSenhaResponsavel.updateMany({
        where: {
          usuarioId: alvo.id,
          colegioId: context.colegioId,
          atendidaEm: null,
        },
        data: { atendidaEm: new Date(), atendidaPorId: context.usuarioId },
      });

      // O token nunca entra na auditoria.
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "GERACAO_LINK_TEMPORARIO_SENHA",
          entidade: "usuarios",
          entidadeId: alvo.id,
          dadosNovos: {
            origem,
            expiraEm: gerado.expiresAt.toISOString(),
            solicitacoesAtendidas: atendidas.count,
          },
          metadata,
        },
        tx,
      );

      return gerado.token;
    });

    // Sem revalidatePath de proposito: atualizar a pagina agora tiraria o item
    // da fila e apagaria da tela o link, que so e exibido esta vez.
    return {
      status: "success",
      caminho: `/reset-password?token=${encodeURIComponent(token)}`,
    };
  } catch {
    return { status: "error", message: "Não foi possível gerar o link." };
  }
}

export async function gerarLinkTemporarioEquipeAction(
  _previousState: LinkTemporarioState,
  formData: FormData,
): Promise<LinkTemporarioState> {
  const context = await requirePermission(PERMISSIONS.USUARIOS_MANAGE);
  return gerarLink("EQUIPE", context, formData);
}

export async function gerarLinkTemporarioResponsavelAction(
  _previousState: LinkTemporarioState,
  formData: FormData,
): Promise<LinkTemporarioState> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  return gerarLink("RESPONSAVEL", context, formData);
}
