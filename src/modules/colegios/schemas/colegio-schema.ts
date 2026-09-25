import { z } from "zod";

export const createColegioSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  codigo: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((value) => value.toUpperCase()),
});

export const toggleColegioSchema = z.object({
  id: z.string().uuid(),
  ativo: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const updateColegioSchema = createColegioSchema.extend({
  id: z.string().uuid(),
});
