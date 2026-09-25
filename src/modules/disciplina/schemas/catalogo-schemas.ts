import { z } from "zod";

import { NATUREZAS_TRANSGRESSAO } from "../constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

const codigo = z
  .string()
  .trim()
  .min(3)
  .max(60)
  .regex(/^[A-Za-z][A-Za-z0-9_]*$/, "Use apenas letras, numeros e underscore.")
  .transform((value) => value.toUpperCase());

const toggle = z.object({
  id: z.string().uuid(),
  ativo: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const toggleCatalogoSchema = toggle;

export const createTransgressaoSchema = z.object({
  codigo,
  descricao: z.string().trim().min(3).max(300),
  natureza: z.enum(NATUREZAS_TRANSGRESSAO),
  baseLegal: optionalText.pipe(z.string().max(120).optional()),
});
export const updateTransgressaoSchema = createTransgressaoSchema
  .omit({ codigo: true })
  .extend({ id: z.string().uuid() });

export const createItemSimplesSchema = z.object({
  codigo,
  descricao: z.string().trim().min(3).max(200),
});
export const updateItemSimplesSchema = z.object({
  id: z.string().uuid(),
  descricao: z.string().trim().min(3).max(200),
});

export const createTipoElogioSchema = z.object({
  codigo,
  nome: z.string().trim().min(3).max(120),
  valorPontos: z.coerce.number().min(0).max(10),
});
export const updateTipoElogioSchema = createTipoElogioSchema
  .omit({ codigo: true })
  .extend({ id: z.string().uuid() });
