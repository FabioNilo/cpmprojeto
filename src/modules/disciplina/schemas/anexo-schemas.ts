import { z } from "zod";

export const CATEGORIAS_ANEXO = [
  "COMUNICACAO",
  "MANIFESTACAO",
  "DECISAO",
  "SANCAO",
  "RECONSIDERACAO",
  "SINDICANCIA",
  "CONSELHO",
  "FAD",
  "OUTRO",
] as const;

export const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024; // 10 MB

export const CONTENT_TYPES_PERMITIDOS = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const enviarAnexoSchema = z.object({
  ocorrenciaId: z.string().uuid().optional(),
  ocorrenciaAlunoId: z.string().uuid().optional(),
  categoria: z.enum(CATEGORIAS_ANEXO).default("OUTRO"),
});

export const anexoIdSchema = z.object({
  anexoId: z.string().uuid(),
});
