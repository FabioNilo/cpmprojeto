import { z } from "zod";

const dataObrigatoria = z
  .string()
  .min(1)
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "Data inválida");

export const determinarAfastamentoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  justificativa: z.string().trim().min(15).max(4000),
  inicioEm: dataObrigatoria,
  diasIniciais: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) {
        return 5;
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : 5;
    })
    .pipe(z.number().int().min(1).max(5)),
});

export const afastamentoIdSchema = z.object({
  afastamentoId: z.string().uuid(),
});

export const encerrarAfastamentoSchema = z.object({
  afastamentoId: z.string().uuid(),
  motivo: z.string().trim().min(5).max(2000),
  revogar: z
    .enum(["on"])
    .optional()
    .transform((v) => v === "on"),
});

export const instaurarSindicanciaSchema = z.object({
  ocorrenciaId: z.string().uuid(),
  objeto: z.string().trim().min(15).max(4000),
});

export const atualizarSindicanciaSchema = z.object({
  sindicanciaId: z.string().uuid(),
  acao: z.enum(["ANDAMENTO", "CONCLUIR", "ARQUIVAR"]),
  conclusao: z
    .string()
    .trim()
    .max(4000)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
});

export const instaurarConselhoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  objeto: z.string().trim().min(15).max(4000),
});

export const parecerConselhoSchema = z.object({
  conselhoId: z.string().uuid(),
  parecer: z.string().trim().min(10).max(4000),
  recomendacao: z.string().trim().min(3).max(2000),
  votosFavor: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? 0 : Number(v)))
    .pipe(z.number().int().min(0).max(50)),
  votosContra: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === "" ? 0 : Number(v)))
    .pipe(z.number().int().min(0).max(50)),
});
