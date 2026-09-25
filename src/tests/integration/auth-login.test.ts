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
      ["x-forwarded-for", "198.51.100.4"],
      ["user-agent", "vitest-integration"],
    ]),
}));

import { prisma } from "@/db/prisma";
import { loginAction } from "@/modules/auth/actions/login-action";

import {
  criarColegio,
  criarPerfil,
  criarUsuarioComPerfil,
} from "./helpers/factories";

function formData(campos: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [chave, valor] of Object.entries(campos)) {
    fd.set(chave, valor);
  }
  return fd;
}

async function usuarioComAcesso(username: string, senha: string) {
  const colegio = await criarColegio();
  const perfil = await criarPerfil("PERFIL_LOGIN", ["dashboard.access"]);
  await criarUsuarioComPerfil({
    colegioId: colegio.id,
    perfilId: perfil.id,
    username,
    senha,
  });
  return colegio;
}

beforeEach(() => {
  cookieStore.clear();
});

describe("loginAction", () => {
  it("autentica credenciais validas: cria sessao, cookie e auditoria de sucesso", async () => {
    const colegio = await usuarioComAcesso("diretor.teste", "Senha@12345");

    await expect(
      loginAction(
        {},
        formData({ identifier: "diretor.teste", password: "Senha@12345" }),
      ),
    ).rejects.toThrow(); // redirect("/dashboard")

    const sessao = await prisma.sessao.findFirst({
      where: { colegioAtivoId: colegio.id },
    });
    expect(sessao).not.toBeNull();
    expect(cookieStore.has("cpm_session")).toBe(true);

    const auditoria = await prisma.auditoria.findFirst({
      where: { acao: "LOGIN_SUCESSO", colegioId: colegio.id },
    });
    expect(auditoria).not.toBeNull();

    const tentativa = await prisma.tentativaLogin.findFirst({
      where: { identificador: "diretor.teste", sucesso: true },
    });
    expect(tentativa).not.toBeNull();
  });

  it("nao revela se o usuario existe: mesma mensagem generica para usuario desconhecido", async () => {
    const resultado = await loginAction(
      {},
      formData({ identifier: "nao.existe", password: "Senha@12345" }),
    );

    expect(resultado.error).toBe("CPF/usuário ou senha inválidos.");

    const auditoria = await prisma.auditoria.findFirst({
      where: { acao: "LOGIN_FALHA", entidadeId: "nao.existe" },
    });
    expect(auditoria).not.toBeNull();

    const tentativa = await prisma.tentativaLogin.findFirst({
      where: { identificador: "nao.existe", sucesso: false },
    });
    expect(tentativa).not.toBeNull();
  });

  it("rejeita senha incorreta com a mesma mensagem generica", async () => {
    await usuarioComAcesso("comandante.teste", "Senha@12345");

    const resultado = await loginAction(
      {},
      formData({ identifier: "comandante.teste", password: "SenhaErrada@1" }),
    );

    expect(resultado.error).toBe("CPF/usuário ou senha inválidos.");
    expect(cookieStore.has("cpm_session")).toBe(false);
  });
});
