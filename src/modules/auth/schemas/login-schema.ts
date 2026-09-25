import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, "Informe CPF ou usuário.")
    .max(80, "CPF ou usuário inválido."),
  password: z.string().min(8, "Informe a senha.").max(128, "Senha inválida."),
  remember: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
