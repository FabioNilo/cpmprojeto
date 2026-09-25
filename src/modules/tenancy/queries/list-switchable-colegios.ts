import "server-only";

import { prisma } from "@/db/prisma";
import { PERMISSIONS } from "@/modules/rbac/permissions";

export async function listSwitchableColegios(usuarioId: string) {
  return prisma.usuarioColegio.findMany({
    where: {
      usuarioId,
      ativo: true,
      colegio: {
        ativo: true,
      },
      perfis: {
        some: {
          perfil: {
            ativo: true,
            permissoes: {
              some: {
                permissao: {
                  codigo: PERMISSIONS.TENANCY_SWITCH,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      colegio: {
        nome: "asc",
      },
    },
    select: {
      colegio: {
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      },
    },
  });
}
