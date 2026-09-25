import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

export const createResponsavelSchema = z.object({
  nome: z.string().trim().min(3).max(160),
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
  telefone: optionalText.pipe(z.string().max(40).optional()),
  alunoId: z.string().uuid(),
  parentesco: optionalText.pipe(z.string().max(80).optional()),
  principal: z
    .enum(["on"])
    .optional()
    .transform((value) => value === "on"),
});

export const updateResponsavelSchema = createResponsavelSchema
  .omit({
    alunoId: true,
    parentesco: true,
    principal: true,
  })
  .extend({
    id: z.string().uuid(),
    password: optionalText.pipe(z.string().min(8).max(128).optional()),
  });

export const toggleResponsavelAccessSchema = z.object({
  id: z.string().uuid(),
  ativo: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const regenerarSenhaResponsavelSchema = z.object({
  id: z.string().uuid(),
});

export const atenderSolicitacaoSenhaSchema = z.object({
  id: z.string().uuid(),
});
