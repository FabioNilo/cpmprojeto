"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { isUniqueConstraintError } from "@/lib/db/prisma-errors";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { hashPassword } from "@/lib/security/password";
import { gerarSenhaProvisoria } from "@/lib/security/senha-provisoria";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  atenderSolicitacaoSenhaSchema,
  createResponsavelSchema,
  regenerarSenhaResponsavelSchema,
  toggleResponsavelAccessSchema,
  updateResponsavelSchema,
} from "../schemas/responsavel-schema";

export async function createResponsavelAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  const parsed = createResponsavelSchema.safeParse({
    nome: formData.get("nome"),
    username: formData.get("username"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    telefone: formData.get("telefone"),
    alunoId: formData.get("alunoId"),
    parentesco: formData.get("parentesco"),
    principal: formData.get("principal") ?? undefined,
  });

  if (!parsed.success) {
    return actionError("Confira os dados do responsável.");
  }

  const senhaProvisoria = gerarSenhaProvisoria();

  try {
    const metadata = await getRequestMetadata();
    const responsavel = await prisma.$transaction(async (tx) => {
      const alunoVinculado = await tx.alunoVinculoColegio.findFirst({
        where: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
        },
        select: { id: true },
      });

      if (!alunoVinculado) {
        throw new Error("ALUNO_FORA_DO_COLEGIO");
      }

      const usuario = await tx.usuario.create({
        data: {
          nome: parsed.data.nome,
          username: parsed.data.username,
          email: parsed.data.email,
          cpf: parsed.data.cpf,
          passwordHash: await hashPassword(senhaProvisoria),
          mudarSenhaObrigatoria: true,
        },
      });

      const usuarioColegio = await tx.usuarioColegio.create({
        data: {
          usuarioId: usuario.id,
          colegioId: context.colegioId,
        },
      });

      const perfilResponsavel = await tx.perfil.findUniqueOrThrow({
        where: { codigo: ROLE_CODES.RESPONSAVEL },
      });

      await tx.usuarioColegioPerfil.create({
        data: {
          usuarioColegioId: usuarioColegio.id,
          perfilId: perfilResponsavel.id,
        },
      });

      const created = await tx.responsavel.create({
        data: {
          usuarioId: usuario.id,
          telefone: parsed.data.telefone,
        },
      });

      await tx.alunoResponsavel.create({
        data: {
          alunoId: parsed.data.alunoId,
          responsavelId: created.id,
          parentesco: parsed.data.parentesco,
          principal: parsed.data.principal,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CRIACAO_RESPONSAVEL",
          entidade: "responsaveis",
          entidadeId: created.id,
          dadosNovos: {
            usuarioId: usuario.id,
            alunoId: parsed.data.alunoId,
          },
          metadata,
        },
        tx,
      );

      return created;
    });

    revalidatePath("/responsaveis");
    revalidatePath("/alunos");
    return actionSuccess(
      `Responsável criado. Login: ${parsed.data.username} - Senha provisória: ${senhaProvisoria} (informe ao responsável; ele troca e aceita o termo no primeiro acesso). Responsável #${responsavel.id.slice(0, 8)}.`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ALUNO_FORA_DO_COLEGIO") {
      return actionError("Aluno não pertence ao colégio ativo.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe usuário com esse login, CPF ou email.");
    }

    return actionError("Não foi possível criar o responsável.");
  }
}

export async function updateResponsavelAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  const parsed = updateResponsavelSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    username: formData.get("username"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    telefone: formData.get("telefone"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados do responsável.");
  }

  try {
    const metadata = await getRequestMetadata();
    const responsavel = await prisma.$transaction(async (tx) => {
      const previous = await tx.responsavel.findFirst({
        where: {
          id: parsed.data.id,
          alunos: {
            some: {
              aluno: {
                vinculosColegio: {
                  some: {
                    colegioId: context.colegioId,
                  },
                },
              },
            },
          },
        },
        select: {
          id: true,
          telefone: true,
          usuario: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
              cpf: true,
            },
          },
        },
      });

      if (!previous) {
        throw new Error("RESPONSAVEL_FORA_DO_COLEGIO");
      }

      const passwordHash = parsed.data.password
        ? await hashPassword(parsed.data.password)
        : undefined;

      const usuario = await tx.usuario.update({
        where: { id: previous.usuario.id },
        data: {
          nome: parsed.data.nome,
          username: parsed.data.username,
          email: parsed.data.email,
          cpf: parsed.data.cpf,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      const updated = await tx.responsavel.update({
        where: { id: previous.id },
        data: {
          telefone: parsed.data.telefone,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_RESPONSAVEL",
          entidade: "responsaveis",
          entidadeId: updated.id,
          dadosAnteriores: {
            telefone: previous.telefone,
            usuario: previous.usuario,
          },
          dadosNovos: {
            telefone: updated.telefone,
            usuario: {
              nome: usuario.nome,
              username: usuario.username,
              email: usuario.email,
              cpf: usuario.cpf,
            },
            senhaAlterada: Boolean(parsed.data.password),
          },
          metadata,
        },
        tx,
      );

      return { id: updated.id, nome: usuario.nome };
    });

    revalidatePath("/responsaveis");
    revalidatePath("/alunos");
    return actionSuccess(`Responsável ${responsavel.nome} atualizado.`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "RESPONSAVEL_FORA_DO_COLEGIO"
    ) {
      return actionError("Responsável não pertence ao colégio ativo.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe usuário com esse login, CPF ou email.");
    }

    return actionError("Não foi possível atualizar o responsável.");
  }
}

export async function regenerarSenhaResponsavelAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  const parsed = regenerarSenhaResponsavelSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return actionError("Responsável inválido.");
  }

  const responsavel = await prisma.responsavel.findFirst({
    where: {
      id: parsed.data.id,
      alunos: {
        some: {
          aluno: {
            vinculosColegio: { some: { colegioId: context.colegioId } },
          },
        },
      },
    },
    select: { id: true, usuarioId: true, usuario: { select: { username: true } } },
  });
  if (!responsavel) {
    return actionError("Responsável não pertence ao colégio ativo.");
  }

  const senhaProvisoria = gerarSenhaProvisoria();
  const passwordHash = await hashPassword(senhaProvisoria);
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: responsavel.usuarioId },
      data: { passwordHash, mudarSenhaObrigatoria: true },
    });
    await registerAudit(
      {
        usuarioId: context.usuarioId,
        colegioId: context.colegioId,
        acao: "RESET_SENHA_RESPONSAVEL",
        entidade: "responsaveis",
        entidadeId: responsavel.id,
        metadata: await getRequestMetadata(),
      },
      tx,
    );
  });

  revalidatePath("/responsaveis");
  return actionSuccess(
    `Nova senha provisória para ${responsavel.usuario.username}: ${senhaProvisoria}`,
  );
}

export async function toggleResponsavelAccessAction(
  formData: FormData,
): Promise<void> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  const parsed = toggleResponsavelAccessSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success) {
    return;
  }

  const responsavel = await prisma.responsavel.findFirst({
    where: {
      id: parsed.data.id,
      alunos: {
        some: {
          aluno: {
            vinculosColegio: {
              some: {
                colegioId: context.colegioId,
              },
            },
          },
        },
      },
    },
    select: {
      id: true,
      usuarioId: true,
    },
  });

  if (!responsavel) {
    return;
  }

  const usuarioColegio = await prisma.usuarioColegio.upsert({
    where: {
      usuarioId_colegioId: {
        usuarioId: responsavel.usuarioId,
        colegioId: context.colegioId,
      },
    },
    update: {
      ativo: parsed.data.ativo,
    },
    create: {
      usuarioId: responsavel.usuarioId,
      colegioId: context.colegioId,
      ativo: parsed.data.ativo,
    },
  });

  const perfilResponsavel = await prisma.perfil.findUniqueOrThrow({
    where: { codigo: ROLE_CODES.RESPONSAVEL },
    select: { id: true },
  });

  await prisma.usuarioColegioPerfil.upsert({
    where: {
      usuarioColegioId_perfilId: {
        usuarioColegioId: usuarioColegio.id,
        perfilId: perfilResponsavel.id,
      },
    },
    update: {},
    create: {
      usuarioColegioId: usuarioColegio.id,
      perfilId: perfilResponsavel.id,
    },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_ACESSO_RESPONSAVEL",
    entidade: "responsaveis",
    entidadeId: responsavel.id,
    dadosNovos: {
      ativo: parsed.data.ativo,
    },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/responsaveis");
}

// Atende um pedido de "esqueci minha senha" de responsavel: gera senha
// provisoria (a repassar por telefone) e marca a solicitacao como atendida.
// A senha antiga nunca e reaproveitada; a solicitacao nunca e apagada.
export async function atenderSolicitacaoSenhaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  const parsed = atenderSolicitacaoSenhaSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    return actionError("Solicitação inválida.");
  }

  const solicitacao = await prisma.solicitacaoSenhaResponsavel.findFirst({
    where: {
      id: parsed.data.id,
      colegioId: context.colegioId,
      atendidaEm: null,
    },
    select: {
      id: true,
      usuarioId: true,
      usuario: { select: { username: true, nome: true } },
    },
  });
  if (!solicitacao) {
    return actionError("Solicitação não encontrada ou já atendida.");
  }

  const senhaProvisoria = gerarSenhaProvisoria();
  const passwordHash = await hashPassword(senhaProvisoria);
  const metadata = await getRequestMetadata();

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: solicitacao.usuarioId },
      data: { passwordHash, mudarSenhaObrigatoria: true },
    });
    await tx.solicitacaoSenhaResponsavel.update({
      where: { id: solicitacao.id },
      data: { atendidaEm: new Date(), atendidaPorId: context.usuarioId },
    });
    await registerAudit(
      {
        usuarioId: context.usuarioId,
        colegioId: context.colegioId,
        acao: "ATENDIMENTO_SOLICITACAO_SENHA",
        entidade: "solicitacoes_senha_responsavel",
        entidadeId: solicitacao.id,
        metadata,
      },
      tx,
    );
  });

  revalidatePath("/responsaveis");
  revalidatePath("/dashboard");
  return actionSuccess(
    `Nova senha provisória para ${solicitacao.usuario.nome} (${solicitacao.usuario.username}): ${senhaProvisoria} - repasse por telefone.`,
  );
}
