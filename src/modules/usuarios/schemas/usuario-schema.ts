import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const createUsuarioSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  posto: optionalText.pipe(z.string().max(40).optional()),
  username: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .transform((value) => value.toLowerCase()),
  email: optionalText.pipe(z.string().email().optional()),
  cpf: optionalText
    .transform((value) => value?.replace(/\D/g, ""))
    .pipe(z.string().length(11).optional()),
  password: z.string().min(8).max(128),
  perfilId: z.coerce.number().int().positive(),
});

export const toggleUsuarioSchema = z.object({
  id: z.string().uuid(),
  ativo: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const updateUsuarioSchema = createUsuarioSchema
  .omit({ password: true })
  .extend({
    id: z.string().uuid(),
    password: optionalText.pipe(z.string().min(8).max(128).optional()),
  });
