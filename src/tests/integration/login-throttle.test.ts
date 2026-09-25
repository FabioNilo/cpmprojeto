import { describe, expect, it } from "vitest";

import { prisma } from "@/db/prisma";
import {
  LOGIN_LIMITE_IDENTIFICADOR,
  avaliarBloqueioLogin,
  registrarTentativaLogin,
} from "@/modules/auth/services/login-throttle-service";

async function registrarFalhas(identificador: string, quantidade: number) {
  for (let i = 0; i < quantidade; i += 1) {
    await registrarTentativaLogin({ identificador, sucesso: false });
  }
}

describe("rate limiting de login (ledger tentativas_login)", () => {
  it("libera enquanto as falhas estao abaixo do limite", async () => {
    await registrarFalhas("aluno@cpm.local", LOGIN_LIMITE_IDENTIFICADOR - 1);

    const resultado = await avaliarBloqueioLogin({
      identificador: "aluno@cpm.local",
    });

    expect(resultado).toEqual({ bloqueado: false });
  });

  it("bloqueia o identificador ao atingir o limite de falhas na janela", async () => {
    await registrarFalhas("bruteforce@cpm.local", LOGIN_LIMITE_IDENTIFICADOR);

    const resultado = await avaliarBloqueioLogin({
      identificador: "bruteforce@cpm.local",
    });

    expect(resultado).toEqual({ bloqueado: true, motivo: "IDENTIFICADOR" });
  });

  it("zera a contagem do identificador apos um login bem-sucedido", async () => {
    await registrarFalhas("recuperado@cpm.local", LOGIN_LIMITE_IDENTIFICADOR);
    await registrarTentativaLogin({
      identificador: "recuperado@cpm.local",
      sucesso: true,
    });

    const resultado = await avaliarBloqueioLogin({
      identificador: "recuperado@cpm.local",
    });

    expect(resultado).toEqual({ bloqueado: false });
  });

  it("nao apaga o historico de tentativas (ledger imutavel)", async () => {
    await registrarFalhas("historico@cpm.local", 2);
    await registrarTentativaLogin({
      identificador: "historico@cpm.local",
      sucesso: true,
    });

    const total = await prisma.tentativaLogin.count({
      where: { identificador: "historico@cpm.local" },
    });

    expect(total).toBe(3);
  });
});
