import { prisma } from "@/db/prisma";
import { hashPassword } from "@/lib/security/password";
import { createSessionToken, hashToken } from "@/lib/security/token";
import { PERMISSIONS } from "@/modules/rbac/permissions";

let contador = 0;

function sufixo(): string {
  contador += 1;
  return `${Date.now().toString(36)}-${contador}`;
}

export async function criarColegio(
  overrides: Partial<{ nome: string; codigo: string; ativo: boolean }> = {},
) {
  return prisma.colegio.create({
    data: {
      nome: overrides.nome ?? "CPM Teste",
      codigo: overrides.codigo ?? `CPM-${sufixo()}`.toUpperCase(),
      ativo: overrides.ativo ?? true,
    },
  });
}

export async function criarPermissoes(
  codigos: string[] = Object.values(PERMISSIONS),
) {
  await prisma.permissao.createMany({
    data: codigos.map((codigo) => ({ codigo, nome: codigo })),
    skipDuplicates: true,
  });
  return prisma.permissao.findMany({ where: { codigo: { in: codigos } } });
}

export async function criarPerfil(codigo: string, permissoes: string[] = []) {
  const perfil = await prisma.perfil.create({
    data: { codigo, nome: codigo },
  });

  if (permissoes.length > 0) {
    const registros = await criarPermissoes(permissoes);
    await prisma.perfilPermissao.createMany({
      data: registros.map((permissao) => ({
        perfilId: perfil.id,
        permissaoId: permissao.id,
      })),
      skipDuplicates: true,
    });
  }

  return perfil;
}

export async function criarUsuarioComPerfil(input: {
  colegioId: string;
  perfilId: number;
  username?: string;
  senha?: string;
  vinculoAtivo?: boolean;
}) {
  const usuario = await prisma.usuario.create({
    data: {
      nome: input.username ?? "Usuario Teste",
      username: input.username ?? `user-${sufixo()}`,
      passwordHash: await hashPassword(input.senha ?? "Senha@12345"),
    },
  });

  const vinculo = await prisma.usuarioColegio.create({
    data: {
      usuarioId: usuario.id,
      colegioId: input.colegioId,
      ativo: input.vinculoAtivo ?? true,
    },
  });

  await prisma.usuarioColegioPerfil.create({
    data: { usuarioColegioId: vinculo.id, perfilId: input.perfilId },
  });

  return { usuario, vinculo };
}

export async function criarSessao(input: {
  usuarioId: string;
  colegioAtivoId: string;
  expiraEm?: Date;
}): Promise<string> {
  const token = createSessionToken();
  await prisma.sessao.create({
    data: {
      usuarioId: input.usuarioId,
      colegioAtivoId: input.colegioAtivoId,
      tokenHash: hashToken(token),
      expiresAt: input.expiraEm ?? new Date(Date.now() + 60 * 60 * 1000),
    },
  });
  return token;
}
