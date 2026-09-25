import { z } from "zod";

import { RESULTADOS_DECISAO } from "../constants";

const textoOpcional = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .transform((valor) => (valor && valor.length > 0 ? valor : undefined));

export const registrarEnquadramentoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  transgressaoId: z.string().uuid(),
  fundamentacao: textoOpcional,
});

export const revogarEnquadramentoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  enquadramentoId: z.string().uuid(),
});

export const registrarDecisaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  resultado: z.enum(RESULTADOS_DECISAO),
  sancaoTipoCodigo: z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor && valor.length > 0 ? valor : undefined)),
  diasSancao: z
    .union([z.string(), z.number()])
    .optional()
    .transform((valor) => {
      if (valor === undefined || valor === "" || valor === null) {
        return undefined;
      }
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero : undefined;
    })
    .pipe(z.number().int().positive().max(60).optional()),
  fundamentacao: z.string().trim().min(10).max(4000),
  atenuanteIds: z.array(z.string().uuid()).default([]),
  agravanteIds: z.array(z.string().uuid()).default([]),
});

export const revogarDecisaoSchema = z.object({
  ocorrenciaAlunoId: z.string().uuid(),
  decisaoId: z.string().uuid(),
});
