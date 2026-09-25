import "server-only";

import { prisma } from "@/db/prisma";

import { ROLE_CODES } from "../permissions";

export async function listPerfisAdmin(incluiAdministrador = true) {
  const perfis = await prisma.perfil.findMany({
    where: incluiAdministrador
      ? {}
      : { codigo: { not: ROLE_CODES.ADMINISTRADOR } },
    orderBy: [{ sistema: "desc" }, { nome: "asc" }],
    select: {
      id: true,
      codigo: true,
      nome: true,
      descricao: true,
      sistema: true,
      ativo: true,
      permissoes: {
        select: { permissao: { select: { codigo: true } } },
      },
      _count: {
        select: { usuarios: true },
      },
    },
  });

  return perfis.map((perfil) => ({
    id: perfil.id,
    codigo: perfil.codigo,
    nome: perfil.nome,
    descricao: perfil.descricao,
    sistema: perfil.sistema,
    ativo: perfil.ativo,
    usuariosVinculados: perfil._count.usuarios,
    permissoes: perfil.permissoes.map((item) => item.permissao.codigo).sort(),
  }));
}
