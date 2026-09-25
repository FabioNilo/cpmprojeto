import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  confirmPasswordResetSchema,
} from "./password-reset-schema";

describe("confirmPasswordResetSchema", () => {
  it("rejeita quando a confirmacao nao confere", () => {
    const resultado = confirmPasswordResetSchema.safeParse({
      token: "a".repeat(40),
      password: "NovaSenha@123",
      confirmarSenha: "Outra@123",
    });
    expect(resultado.success).toBe(false);
    expect(resultado.success ? "" : resultado.error.issues[0]?.message).toBe(
      "As senhas não conferem.",
    );
  });

  it("aceita token e senhas coerentes", () => {
    const resultado = confirmPasswordResetSchema.safeParse({
      token: "a".repeat(40),
      password: "NovaSenha@123",
      confirmarSenha: "NovaSenha@123",
    });
    expect(resultado.success).toBe(true);
  });
});

describe("changePasswordSchema", () => {
  it("rejeita nova senha igual a atual", () => {
    const resultado = changePasswordSchema.safeParse({
      senhaAtual: "Senha@12345",
      novaSenha: "Senha@12345",
      confirmarSenha: "Senha@12345",
    });
    expect(resultado.success).toBe(false);
  });

  it("aceita troca valida", () => {
    const resultado = changePasswordSchema.safeParse({
      senhaAtual: "Senha@12345",
      novaSenha: "NovaSenha@678",
      confirmarSenha: "NovaSenha@678",
    });
    expect(resultado.success).toBe(true);
  });
});
