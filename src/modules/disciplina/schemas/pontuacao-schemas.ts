import { z } from "zod";

export const registrarElogioSchema = z.object({
  alunoId: z.string().uuid(),
  tipoElogioCodigo: z.string().trim().min(1),
  descricao: z.string().trim().min(5).max(2000),
});

export const registrarAjusteSchema = z.object({
  alunoId: z.string().uuid(),
  valor: z
    .union([z.string(), z.number()])
    .transform((valor) => Number(valor))
    .pipe(
      z
        .number()
        .refine((n) => Number.isFinite(n) && n !== 0, "Valor inválido")
        .refine((n) => Math.abs(n) <= 10, "Ajuste máximo de 10 pontos"),
    ),
  motivo: z.string().trim().min(10).max(2000),
});
