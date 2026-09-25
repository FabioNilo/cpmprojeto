import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const createAlunoSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  matriculaGeral: optionalText.pipe(z.string().max(40).optional()),
  turmaId: optionalText.pipe(z.string().uuid().optional()),
  numero: optionalText.pipe(z.string().max(20).optional()),
  necessidadeEspecial: z
    .enum(["on"])
    .optional()
    .transform((value) => value === "on"),
});

export const updateAlunoVinculoStatusSchema = z.object({
  vinculoId: z.string().uuid(),
  status: z.enum(["ATIVO", "TRANSFERIDO", "ENCERRADO"]),
});

export const transferAlunoSchema = z.object({
  alunoId: z.string().uuid(),
  destinoColegioId: z.string().uuid(),
  destinoTurmaId: optionalText.pipe(z.string().uuid().optional()),
  numero: optionalText.pipe(z.string().max(20).optional()),
  dataTransferencia: z.coerce.date(),
  motivo: optionalText.pipe(z.string().max(280).optional()),
});

export const updateAlunoSchema = createAlunoSchema
  .pick({
    nome: true,
    matriculaGeral: true,
    necessidadeEspecial: true,
  })
  .extend({
    id: z.string().uuid(),
  });
