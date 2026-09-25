import "server-only";

import { prisma } from "@/db/prisma";
import { ROLE_CODES } from "@/modules/rbac/permissions";

export async function listUsuariosByColegio(
  colegioId: string,
  includeAdministradores = true,
) {
  return prisma.usuario.findMany({
    where: {
      colegios: {
        some: {
          colegioId,
        },
      },
      ...(includeAdministradores
        ? {}
        : {
            NOT: {
              colegios: {
                some: {
                  colegioId,
                  perfis: {
                    some: {
                      perfil: {
                        codigo: ROLE_CODES.ADMINISTRADOR,
                      },
                    },
                  },
                },
              },
            },
          }),
    },
    orderBy: { nome: "asc" },
    take: 50,
    select: {
      id: true,
      nome: true,
      posto: true,
      username: true,
      email: true,
      cpf: true,
      ativo: true,
      colegios: {
        where: { colegioId },
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
}
