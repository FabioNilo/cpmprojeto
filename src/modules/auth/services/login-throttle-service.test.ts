import { describe, expect, it } from "vitest";

import {
  LOGIN_LIMITE_IDENTIFICADOR,
  LOGIN_LIMITE_IP,
  decidirBloqueioLogin,
} from "./login-throttle-service";

describe("decidirBloqueioLogin", () => {
  it("libera quando as falhas estao abaixo dos limites", () => {
    expect(
      decidirBloqueioLogin({
        falhasIdentificador: LOGIN_LIMITE_IDENTIFICADOR - 1,
        falhasIp: LOGIN_LIMITE_IP - 1,
      }),
    ).toEqual({ bloqueado: false });
  });

  it("bloqueia por identificador ao atingir o limite", () => {
    expect(
      decidirBloqueioLogin({
        falhasIdentificador: LOGIN_LIMITE_IDENTIFICADOR,
        falhasIp: 0,
      }),
    ).toEqual({ bloqueado: true, motivo: "IDENTIFICADOR" });
  });

  it("bloqueia por IP quando o identificador varia mas o IP repete", () => {
    expect(
      decidirBloqueioLogin({ falhasIdentificador: 1, falhasIp: LOGIN_LIMITE_IP }),
    ).toEqual({ bloqueado: true, motivo: "IP" });
  });

  it("prioriza o motivo de identificador sobre o de IP", () => {
    expect(
      decidirBloqueioLogin({
        falhasIdentificador: LOGIN_LIMITE_IDENTIFICADOR + 3,
        falhasIp: LOGIN_LIMITE_IP + 10,
      }),
    ).toEqual({ bloqueado: true, motivo: "IDENTIFICADOR" });
  });

  it("respeita limites customizados", () => {
    expect(
      decidirBloqueioLogin({
        falhasIdentificador: 2,
        falhasIp: 0,
        limiteIdentificador: 2,
      }),
    ).toEqual({ bloqueado: true, motivo: "IDENTIFICADOR" });
  });
});
