import { z } from "zod";

export const AUDITORIA_PAGE_SIZE = 25;
export const AUDITORIA_EXPORT_LIMIT = 5000;

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? undefined : value));

const optionalDate = optionalText.pipe(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
);

export const auditoriaFilterSchema = z.object({
  acao: optionalText.pipe(z.string().max(80).optional()).catch(undefined),
  entidade: optionalText.pipe(z.string().max(80).optional()).catch(undefined),
  usuarioId: optionalText.pipe(z.string().uuid().optional()).catch(undefined),
  de: optionalDate.catch(undefined),
  ate: optionalDate.catch(undefined),
  pagina: z.coerce.number().int().min(1).catch(1),
});

export type AuditoriaFilter = z.infer<typeof auditoriaFilterSchema>;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseAuditoriaFilters(
  searchParams: RawSearchParams,
): AuditoriaFilter {
  const parsed = auditoriaFilterSchema.safeParse({
    acao: firstValue(searchParams.acao),
    entidade: firstValue(searchParams.entidade),
    usuarioId: firstValue(searchParams.usuarioId),
    de: firstValue(searchParams.de),
    ate: firstValue(searchParams.ate),
    pagina: firstValue(searchParams.pagina) ?? 1,
  });

  return parsed.success ? parsed.data : { pagina: 1 };
}

export function auditoriaFiltersToQuery(
  filtros: AuditoriaFilter,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filtros.acao) {
    params.set("acao", filtros.acao);
  }
  if (filtros.entidade) {
    params.set("entidade", filtros.entidade);
  }
  if (filtros.usuarioId) {
    params.set("usuarioId", filtros.usuarioId);
  }
  if (filtros.de) {
    params.set("de", filtros.de);
  }
  if (filtros.ate) {
    params.set("ate", filtros.ate);
  }

  return params;
}
