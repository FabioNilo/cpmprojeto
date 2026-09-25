import { z } from "zod";

export const createAnoLetivoSchema = z.object({
  ano: z.coerce.number().int().min(2000).max(2100),
});

export const toggleAnoLetivoSchema = z.object({
  id: z.string().uuid(),
  ativo: z.enum(["true", "false"]).transform((value) => value === "true"),
});
