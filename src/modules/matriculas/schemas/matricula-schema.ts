import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const createMatriculaSchema = z.object({
  alunoId: z.string().uuid(),
  turmaId: z.string().uuid(),
  numero: optionalText.pipe(z.string().max(20).optional()),
});

export const transferirTurmaMatriculaSchema = z.object({
  id: z.string().uuid(),
  turmaId: z.string().uuid(),
});

export const cancelarMatriculaSchema = z.object({
  id: z.string().uuid(),
  motivo: optionalText.pipe(z.string().max(200).optional()),
});

export const reativarMatriculaSchema = z.object({
  id: z.string().uuid(),
});
