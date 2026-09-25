import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const createPerfilSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Use apenas letras, numeros e underscore.")
    .transform((value) => value.toUpperCase()),
  nome: z.string().trim().min(3).max(80),
  descricao: optionalText.pipe(z.string().max(200).optional()),
});

export const updatePerfilSchema = z.object({
  id: z.coerce.number().int().positive(),
  nome: z.string().trim().min(3).max(80),
  descricao: optionalText.pipe(z.string().max(200).optional()),
});

export const togglePerfilSchema = z.object({
  id: z.coerce.number().int().positive(),
  ativo: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const setPerfilPermissoesSchema = z.object({
  perfilId: z.coerce.number().int().positive(),
  permissoes: z.array(z.string().trim().min(1)).default([]),
});
