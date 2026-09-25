// As turmas sao nomeadas "<serie> <curso> <sala>", ex.: "1º MED A", "9º FUN AM".
// "Turma" (para o usuario final) = serie + curso; "Sala" = o ultimo token.
export type TurmaPartes = { serie: string; sala: string };

export function parseTurmaNome(nome: string): TurmaPartes {
  const tokens = nome.trim().split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) {
    return { serie: tokens[0] ?? "", sala: "" };
  }
  return {
    serie: tokens.slice(0, -1).join(" "),
    sala: tokens[tokens.length - 1],
  };
}

function ordenar(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { numeric: true });
}

export function seriesDistintas(nomes: readonly string[]): string[] {
  const set = new Set<string>();
  for (const nome of nomes) {
    const { serie } = parseTurmaNome(nome);
    if (serie) set.add(serie);
  }
  return [...set].sort(ordenar);
}

export function salasDistintas(
  nomes: readonly string[],
  serie?: string,
): string[] {
  const set = new Set<string>();
  for (const nome of nomes) {
    const partes = parseTurmaNome(nome);
    if (!partes.sala) continue;
    if (serie && partes.serie !== serie) continue;
    set.add(partes.sala);
  }
  return [...set].sort(ordenar);
}

// Mapa serie -> salas, para os filtros dependentes no cliente.
export function salasPorSerie(
  nomes: readonly string[],
): Record<string, string[]> {
  const mapa: Record<string, Set<string>> = {};
  for (const nome of nomes) {
    const { serie, sala } = parseTurmaNome(nome);
    if (!serie || !sala) continue;
    (mapa[serie] ??= new Set()).add(sala);
  }
  return Object.fromEntries(
    Object.entries(mapa).map(([serie, salas]) => [
      serie,
      [...salas].sort(ordenar),
    ]),
  );
}
