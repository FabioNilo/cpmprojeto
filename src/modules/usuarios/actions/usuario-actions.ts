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
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  createUsuarioSchema,
  toggleUsuarioSchema,
  updateUsuarioSchema,
} from "../schemas/usuario-schema";

function canManageAdministrador(contextPerfis: string[]): boolean {
  return contextPerfis.includes(ROLE_CODES.ADMINISTRADOR);
}

async function assertAssignablePerfil(
  perfilId: number,
  allowAdministrador: boolean,
): Promise<void> {
  const perfil = await prisma.perfil.findFirst({
    where: {
      id: perfilId,
      ativo: true,
    },
    select: {
      codigo: true,
    },
  });

  if (!perfil) {
    throw new Error("PERFIL_INVALIDO");
  }

  if (!allowAdministrador && perfil.codigo === ROLE_CODES.ADMINISTRADOR) {
    throw new Error("ADMINISTRADOR_PROTEGIDO");
  }
}

export async function createUsuarioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.USUARIOS_MANAGE);
  const parsed = createUsuarioSchema.safeParse({
    nome: formData.get("nome"),
    posto: formData.get("posto"),
    username: formData.get("username"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    password: formData.get("password"),
    perfilId: formData.get("perfilId"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados do usuário.");
  }

  try {
    await assertAssignablePerfil(
      parsed.data.perfilId,
      canManageAdministrador(context.perfis),
    );

    const metadata = await getRequestMetadata();
    const usuario = await prisma.$transaction(async (tx) => {
      const created = await tx.usuario.create({
        data: {
          nome: parsed.data.nome,
          posto: parsed.data.posto,
          username: parsed.data.username,
          email: parsed.data.email,
          cpf: parsed.data.cpf,
          passwordHash: await hashPassword(parsed.data.password),
        },
      });

      const vinculo = await tx.usuarioColegio.create({
        data: {
          usuarioId: created.id,
          colegioId: context.colegioId,
        },
      });

      await tx.usuarioColegioPerfil.create({
        data: {
          usuarioColegioId: vinculo.id,
          perfilId: parsed.data.perfilId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CRIACAO_USUARIO",
          entidade: "usuarios",
          entidadeId: created.id,
          dadosNovos: {
            nome: created.nome,
            username: created.username,
          },
          metadata,
        },
        tx,
      );

      return created;
    });

    revalidatePath("/usuarios");
    return actionSuccess(`Usuário ${usuario.nome} criado.`);
  } catch (error) {
    if (error instanceof Error && error.message === "PERFIL_INVALIDO") {
      return actionError("Perfil inválido para o colégio ativo.");
    }

    if (error instanceof Error && error.message === "ADMINISTRADOR_PROTEGIDO") {
      return actionError("Diretores não podem criar usuário administrador.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe usuário com esse login, CPF ou email.");
    }

    return actionError("Não foi possível criar o usuário.");
  }
}

export async function toggleUsuarioAction(formData: FormData): Promise<void> {
  const context = await requirePermission(PERMISSIONS.USUARIOS_MANAGE);
  const parsed = toggleUsuarioSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });

  if (!parsed.success) {
    return;
  }

  const allowAdministrador = canManageAdministrador(context.perfis);
  const usuario = await prisma.usuario.findFirst({
    where: {
      id: parsed.data.id,
      colegios: {
        some: {
          colegioId: context.colegioId,
        },
      },
    },
    select: {
      id: true,
      colegios: {
        where: { colegioId: context.colegioId },
        select: {
          perfis: {
            select: {
              perfil: {
                select: {
                  codigo: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    return;
  }

  const isTargetAdministrador = usuario.colegios[0]?.perfis.some(
    (usuarioPerfil) => usuarioPerfil.perfil.codigo === ROLE_CODES.ADMINISTRADOR,
  );

  if (isTargetAdministrador && !allowAdministrador) {
    await registerAudit({
      usuarioId: context.usuarioId,
      colegioId: context.colegioId,
      acao: "ALTERACAO_USUARIO_NEGADA",
      entidade: "usuarios",
      entidadeId: usuario.id,
      dadosNovos: {
        motivo: "ADMINISTRADOR_PROTEGIDO",
      },
      metadata: await getRequestMetadata(),
    });
    return;
  }

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { ativo: parsed.data.ativo },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_USUARIO",
    entidade: "usuarios",
    entidadeId: usuario.id,
    dadosNovos: {
      ativo: parsed.data.ativo,
    },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/usuarios");
}

export async function updateUsuarioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.USUARIOS_MANAGE);
  const parsed = updateUsuarioSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    posto: formData.get("posto"),
    username: formData.get("username"),
    email: formData.get("email"),
    cpf: formData.get("cpf"),
    password: formData.get("password"),
    perfilId: formData.get("perfilId"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados do usuário.");
  }

  try {
    const allowAdministrador = canManageAdministrador(context.perfis);

    await assertAssignablePerfil(parsed.data.perfilId, allowAdministrador);

    const metadata = await getRequestMetadata();
    const usuario = await prisma.$transaction(async (tx) => {
      const previous = await tx.usuario.findFirst({
        where: {
          id: parsed.data.id,
          colegios: {
            some: {
              colegioId: context.colegioId,
            },
          },
        },
        select: {
          id: true,
          nome: true,
          posto: true,
          username: true,
          email: true,
          cpf: true,
          colegios: {
            where: { colegioId: context.colegioId },
            select: {
              id: true,
              perfis: {
                select: {
                  perfilId: true,
                  perfil: {
                    select: {
                      codigo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!previous || !previous.colegios[0]) {
        throw new Error("USUARIO_FORA_DO_COLEGIO");
      }

      const isTargetAdministrador = previous.colegios[0].perfis.some(
        (usuarioPerfil) =>
          usuarioPerfil.perfil.codigo === ROLE_CODES.ADMINISTRADOR,
      );

      if (isTargetAdministrador && !allowAdministrador) {
        throw new Error("ADMINISTRADOR_PROTEGIDO");
      }

      const passwordHash = parsed.data.password
        ? await hashPassword(parsed.data.password)
        : undefined;

      const updated = await tx.usuario.update({
        where: { id: previous.id },
        data: {
          nome: parsed.data.nome,
          posto: parsed.data.posto,
          username: parsed.data.username,
          email: parsed.data.email,
          cpf: parsed.data.cpf,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });

      const usuarioColegioId = previous.colegios[0].id;

      await tx.usuarioColegioPerfil.deleteMany({
        where: {
          usuarioColegioId,
          perfilId: {
            not: parsed.data.perfilId,
          },
        },
      });

      await tx.usuarioColegioPerfil.upsert({
        where: {
          usuarioColegioId_perfilId: {
            usuarioColegioId,
            perfilId: parsed.data.perfilId,
          },
        },
        update: {},
        create: {
          usuarioColegioId,
          perfilId: parsed.data.perfilId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_USUARIO",
          entidade: "usuarios",
          entidadeId: updated.id,
          dadosAnteriores: {
            nome: previous.nome,
            posto: previous.posto,
            username: previous.username,
            email: previous.email,
            cpf: previous.cpf,
            perfis: previous.colegios[0].perfis.map(
              (perfil) => perfil.perfil.codigo,
            ),
          },
          dadosNovos: {
            nome: updated.nome,
            posto: updated.posto,
            username: updated.username,
            email: updated.email,
            cpf: updated.cpf,
            perfilId: parsed.data.perfilId,
            senhaAlterada: Boolean(parsed.data.password),
          },
          metadata,
        },
        tx,
      );

      return updated;
    });

    revalidatePath("/usuarios");
    return actionSuccess(`Usuário ${usuario.nome} atualizado.`);
  } catch (error) {
    if (error instanceof Error && error.message === "USUARIO_FORA_DO_COLEGIO") {
      return actionError("Usuário não pertence ao colégio ativo.");
    }

    if (error instanceof Error && error.message === "PERFIL_INVALIDO") {
      return actionError("Perfil inválido para o colégio ativo.");
    }

    if (error instanceof Error && error.message === "ADMINISTRADOR_PROTEGIDO") {
      return actionError("Diretores não podem alterar administradores.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe usuário com esse login, CPF ou email.");
    }

    return actionError("Não foi possível atualizar o usuário.");
  }
}
