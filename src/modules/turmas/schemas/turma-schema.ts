import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const createTurmaSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
  nome: z.string().trim().min(1).max(60),
  turno: optionalText.pipe(z.string().max(40).optional()),
});

export const toggleTurmaSchema = z.object({
  id: z.string().uuid(),
  ativa: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const updateTurmaSchema = createTurmaSchema.extend({
  id: z.string().uuid(),
});
