import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  identifier: z.string().trim().min(3).max(80),
});

export const confirmPasswordResetSchema = z
  .object({
    token: z.string().trim().min(20).max(200),
    password: z.string().min(8).max(128),
    confirmarSenha: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  });

export const changePasswordSchema = z
  .object({
    senhaAtual: z.string().min(1).max(128),
    novaSenha: z.string().min(8).max(128),
    confirmarSenha: z.string().min(8).max(128),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  })
  .refine((data) => data.novaSenha !== data.senhaAtual, {
    message: "A nova senha deve ser diferente da atual.",
    path: ["novaSenha"],
  });
