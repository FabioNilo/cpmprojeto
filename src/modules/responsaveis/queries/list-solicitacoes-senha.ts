import "server-only";

import type { Prisma } from "@prisma/client";

import { prisma } from "@/db/prisma";
import { ROLE_CODES } from "@/modules/rbac/permissions";

// A mesma tabela guarda os pedidos de nova senha de toda conta. A fila segue a
// regra do link temporario: conta com qualquer perfil alem de RESPONSAVEL, em
// qualquer colegio, e tratada como equipe.
const contaComPerfilDeEquipe: Prisma.UsuarioWhereInput = {
  colegios: {
    some: { perfis: { some: { perfil: { codigo: { not: ROLE_CODES.RESPONSAVEL } } } } },
  },
};

const contaAdministradora: Prisma.UsuarioWhereInput = {
  colegios: {
    some: { perfis: { some: { perfil: { codigo: ROLE_CODES.ADMINISTRADOR } } } },
  },
};

function filaResponsaveis(colegioId: string): Prisma.SolicitacaoSenhaResponsavelWhereInput {
  return {
    colegioId,
    atendidaEm: null,
    usuario: {
      responsavel: { isNot: null },
      NOT: contaComPerfilDeEquipe,
    },
  };
}

function filaEquipe(
  colegioId: string,
  incluirAdministradores: boolean,
): Prisma.SolicitacaoSenhaResponsavelWhereInput {
  return {
    colegioId,
    atendidaEm: null,
    usuario: {
      OR: [{ responsavel: { is: null } }, contaComPerfilDeEquipe],
      ...(incluirAdministradores ? {} : { NOT: contaAdministradora }),
    },
  };
}

export async function listSolicitacoesSenhaPendentes(colegioId: string) {
  return prisma.solicitacaoSenhaResponsavel.findMany({
    where: filaResponsaveis(colegioId),
    orderBy: { criadoEm: "asc" },
    select: {
      id: true,
      criadoEm: true,
      usuario: {
        select: {
          id: true,
          nome: true,
          username: true,
          responsavel: {
            select: {
              telefone: true,
              alunos: {
                select: { aluno: { select: { nome: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export async function contarSolicitacoesSenhaPendentes(
  colegioId: string,
): Promise<number> {
  return prisma.solicitacaoSenhaResponsavel.count({
    where: filaResponsaveis(colegioId),
  });
}

export async function listSolicitacoesSenhaEquipe(
  colegioId: string,
  incluirAdministradores: boolean,
) {
  return prisma.solicitacaoSenhaResponsavel.findMany({
    where: filaEquipe(colegioId, incluirAdministradores),
    orderBy: { criadoEm: "asc" },
    select: {
      id: true,
      criadoEm: true,
      usuario: {
        select: { id: true, nome: true, posto: true, username: true },
      },
    },
  });
}

export async function contarSolicitacoesSenhaEquipe(
  colegioId: string,
  incluirAdministradores: boolean,
): Promise<number> {
  return prisma.solicitacaoSenhaResponsavel.count({
    where: filaEquipe(colegioId, incluirAdministradores),
  });
}
