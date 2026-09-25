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
      ["x-forwarded-for", "192.0.2.10"],
      ["user-agent", "vitest-integration"],
    ]),
}));

import { prisma } from "@/db/prisma";
import { SESSION_COOKIE_NAME } from "@/modules/auth/services/session-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { switchTenantAction } from "@/modules/tenancy/actions/switch-tenant-action";

import {
  criarColegio,
  criarPerfil,
  criarSessao,
  criarUsuarioComPerfil,
} from "./helpers/factories";

function formData(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    fd.set(chave, valor);
  }
  return fd;
}

beforeEach(() => {
  cookieStore.clear();
});

describe("switchTenantAction (troca de tenant sempre validada no servidor)", () => {
  it("nega troca para colegio sem vinculo do usuario e registra TROCA_COLEGIO_NEGADA", async () => {
    const origem = await criarColegio({ codigo: "CPM-ORIGEM" });
    const destinoSemVinculo = await criarColegio({ codigo: "CPM-ALHEIO" });
    const perfil = await criarPerfil("PERFIL_SWITCH", [
      PERMISSIONS.DASHBOARD_ACCESS,
      PERMISSIONS.TENANCY_SWITCH,
    ]);
    const { usuario } = await criarUsuarioComPerfil({
      colegioId: origem.id,
      perfilId: perfil.id,
    });
    const token = await criarSessao({
      usuarioId: usuario.id,
      colegioAtivoId: origem.id,
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    await switchTenantAction(formData({ colegioId: destinoSemVinculo.id }));

    const sessao = await prisma.sessao.findFirst({
      where: { usuarioId: usuario.id },
    });
    expect(sessao?.colegioAtivoId).toBe(origem.id);

    const negada = await prisma.auditoria.findFirst({
      where: {
        acao: "TROCA_COLEGIO_NEGADA",
        entidadeId: destinoSemVinculo.id,
      },
    });
    expect(negada).not.toBeNull();
  });

  it("troca para colegio com vinculo ativo e permissao, gravando TROCA_COLEGIO_ATIVO", async () => {
    const origem = await criarColegio({ codigo: "CPM-A" });
    const destino = await criarColegio({ codigo: "CPM-B" });
    const perfil = await criarPerfil("PERFIL_SWITCH_2", [
      PERMISSIONS.DASHBOARD_ACCESS,
      PERMISSIONS.TENANCY_SWITCH,
    ]);
    const { usuario, vinculo } = await criarUsuarioComPerfil({
      colegioId: origem.id,
      perfilId: perfil.id,
    });
    const vinculoDestino = await prisma.usuarioColegio.create({
      data: { usuarioId: usuario.id, colegioId: destino.id, ativo: true },
    });
    await prisma.usuarioColegioPerfil.create({
      data: { usuarioColegioId: vinculoDestino.id, perfilId: perfil.id },
    });
    expect(vinculo.colegioId).toBe(origem.id);

    const token = await criarSessao({
      usuarioId: usuario.id,
      colegioAtivoId: origem.id,
    });
    cookieStore.set(SESSION_COOKIE_NAME, token);

    await expect(
      switchTenantAction(formData({ colegioId: destino.id })),
    ).rejects.toThrow(); // redirect("/dashboard")

    const sessao = await prisma.sessao.findFirst({
      where: { usuarioId: usuario.id },
    });
    expect(sessao?.colegioAtivoId).toBe(destino.id);

    const trocada = await prisma.auditoria.findFirst({
      where: { acao: "TROCA_COLEGIO_ATIVO", colegioId: destino.id },
    });
    expect(trocada).not.toBeNull();
  });
});
