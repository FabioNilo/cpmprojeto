import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieStore } = vi.hoisted(() => ({
  cookieStore: new Map<string, string>(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieStore.has(name)
        ? { name, value: cookieStore.get(name) as string }
        : undefined,
    set: (name: string, value: string) => {
      cookieStore.set(name, value);
    },
    delete: (name: string) => {
      cookieStore.delete(name);
    },
    has: (name: string) => cookieStore.has(name),
  }),
  headers: async () =>
    new Headers([
      ["x-forwarded-for", "203.0.113.7"],
      ["user-agent", "vitest-integration"],
    ]),
}));

import { prisma } from "@/db/prisma";
import { SESSION_COOKIE_NAME } from "@/modules/auth/services/session-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  criarColegio,
  criarPerfil,
  criarSessao,
  criarUsuarioComPerfil,
} from "./helpers/factories";

async function autenticar(permissoes: string[]) {
  const colegio = await criarColegio();
  const perfil = await criarPerfil("PERFIL_TESTE", permissoes);
  const { usuario } = await criarUsuarioComPerfil({
    colegioId: colegio.id,
    perfilId: perfil.id,
  });
  const token = await criarSessao({
    usuarioId: usuario.id,
    colegioAtivoId: colegio.id,
  });
  cookieStore.set(SESSION_COOKIE_NAME, token);
  return { colegio, usuario };
}

beforeEach(() => {
  cookieStore.clear();
});

describe("requirePermission (guarda de RBAC)", () => {
  it("libera o acesso quando o perfil do colegio ativo tem a permissao", async () => {
    const { colegio, usuario } = await autenticar([
      PERMISSIONS.DASHBOARD_ACCESS,
    ]);

    const context = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);

    expect(context.usuarioId).toBe(usuario.id);
    expect(context.colegioId).toBe(colegio.id);
    expect(context.permissoes).toContain(PERMISSIONS.DASHBOARD_ACCESS);
  });

  it("bloqueia e registra ACESSO_NEGADO quando falta a permissao", async () => {
    const { colegio, usuario } = await autenticar([
      PERMISSIONS.DASHBOARD_ACCESS,
    ]);

    await expect(
      requirePermission(PERMISSIONS.AUDITORIA_READ),
    ).rejects.toThrow();

    const auditoria = await prisma.auditoria.findFirst({
      where: {
        acao: "ACESSO_NEGADO",
        usuarioId: usuario.id,
        colegioId: colegio.id,
        entidadeId: PERMISSIONS.AUDITORIA_READ,
      },
    });

    expect(auditoria).not.toBeNull();
    expect(auditoria?.ip).toBe("203.0.113.7");
  });
});
