import { z } from "zod";

export const aplicarSancaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  decisaoId: z.string().uuid(),
  observacao: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((valor) => (valor && valor.length > 0 ? valor : undefined)),
  // Aluno com necessidadeEspecial: pontuacao digitada manualmente em vez do
  // valor fixo do catalogo. Ignorado pela action se o aluno nao tiver a
  // marcacao (sancao-rules.ts > resolverImpactoSancao).
  impactoPontosManual: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor && valor.length > 0 ? valor : undefined))
    .pipe(
      z.coerce
        .number()
        .min(-10, "O impacto manual não pode ser menor que -10.")
        .max(0, "O impacto manual não pode ser positivo.")
        .optional(),
    ),
});

export const modificarSancaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  sancaoId: z.string().uuid(),
  motivo: z.string().trim().min(5).max(2000),
});

export const cumprimentoSancaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  sancaoId: z.string().uuid(),
  motivo: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((valor) => (valor && valor.length > 0 ? valor : "Cumprimento registrado.")),
});
