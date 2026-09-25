import { z } from "zod";

import { TIPOS_OCORRENCIA } from "../constants";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

const optionalUuid = optionalText.pipe(z.string().uuid().optional());

export const createOcorrenciaSchema = z.object({
  tipo: z.enum(TIPOS_OCORRENCIA),
  dataOcorrencia: z.coerce.date(),
  local: optionalText.pipe(z.string().max(160).optional()),
  materia: optionalText.pipe(z.string().max(120).optional()),
  // Sugestao escolhida no dropdown de motivos frequentes (opcional - so uma
  // dica pro enquadramento depois, ver Ocorrencia.motivoSugeridoId).
  motivoSugeridoId: optionalUuid,
  descricao: z.string().trim().min(10).max(4000),
  sigiloso: z
    .enum(["on"])
    .optional()
    .transform((value) => value === "on"),
  alunoIds: z.array(z.string().uuid()).min(1).max(60),
});

export const updateOcorrenciaSchema = z.object({
  id: z.string().uuid(),
  tipo: z.enum(TIPOS_OCORRENCIA),
  dataOcorrencia: z.coerce.date(),
  local: optionalText.pipe(z.string().max(160).optional()),
  materia: optionalText.pipe(z.string().max(120).optional()),
  descricao: z.string().trim().min(10).max(4000),
  sigiloso: z
    .enum(["on"])
    .optional()
    .transform((value) => value === "on"),
});

export const ocorrenciaIdSchema = z.object({
  id: z.string().uuid(),
});

export const arquivarOcorrenciaSchema = z.object({
  id: z.string().uuid(),
  motivo: z.string().trim().min(3).max(400),
});
