// Serializacao canonica (chaves ordenadas) para que o hash de duas fichas com
// o mesmo conteudo seja identico, independentemente da ordem das propriedades.
export function canonicalJson(value: unknown): string {
  return JSON.stringify(ordenar(value));
}

function ordenar(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(ordenar);
  }
  if (value && typeof value === "object") {
    const entradas = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return Object.fromEntries(entradas.map(([k, v]) => [k, ordenar(v)]));
  }
  return value;
}
