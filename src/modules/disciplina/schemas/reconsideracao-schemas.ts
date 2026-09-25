import { z } from "zod";

export const solicitarReconsideracaoSchema = z.object({
  sancaoId: z.string().uuid(),
  texto: z.string().trim().min(15).max(4000),
});

export const decidirReconsideracaoSchema = z.object({
  reconsideracaoId: z.string().uuid(),
  resultado: z.enum(["DEFERIR", "INDEFERIR"]),
  parecer: z.string().trim().min(10).max(4000),
  novoTipoSancaoCodigo: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  novosDias: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "" || v === null) {
        return undefined;
      }
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    })
    .pipe(z.number().int().positive().max(60).optional()),
});
