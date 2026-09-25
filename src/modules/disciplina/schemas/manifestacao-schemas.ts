import { z } from "zod";

import { MEIOS_CIENCIA, TIPOS_MANIFESTACAO } from "../constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const registrarManifestacaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  tipo: z.enum(TIPOS_MANIFESTACAO),
  texto: z.string().trim().min(10).max(4000),
  viaPresencial: z
    .enum(["on"])
    .optional()
    .transform((value) => value === "on"),
});

export const confirmarCienciaSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  meio: z.enum(MEIOS_CIENCIA),
  observacao: optionalText.pipe(z.string().max(400).optional()),
});

export const avaliarManifestacaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  resultado: z.enum(["ACOLHER", "INDEFERIR"]),
  parecer: z.string().trim().min(5).max(2000),
});
