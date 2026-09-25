import "server-only";

import { prisma } from "@/db/prisma";
import { ROLE_CODES } from "../permissions";

export async function listPerfisAtivos(includeAdministrador = true) {
  return prisma.perfil.findMany({
    where: {
      ativo: true,
      ...(includeAdministrador
        ? {}
        : {
            codigo: {
              not: ROLE_CODES.ADMINISTRADOR,
            },
          }),
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      codigo: true,
      nome: true,
    },
  });
}
