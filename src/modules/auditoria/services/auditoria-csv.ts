type AuditoriaCsvRow = {
  dataHora: Date;
  acao: string;
  entidade: string | null;
  entidadeId: string | null;
  ip: string | null;
  usuario: { nome: string } | null;
};

const CSV_HEADERS = [
  "data_hora",
  "acao",
  "entidade",
  "entidade_id",
  "usuario",
  "ip",
] as const;

const CSV_SEPARATOR = ";";
const CSV_NEWLINE = "\r\n";

function escapeCsvValue(value: string): string {
  if (/["\n\r]/.test(value) || value.includes(CSV_SEPARATOR)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function toAuditoriaCsv(rows: AuditoriaCsvRow[]): string {
  const lines = [CSV_HEADERS.join(CSV_SEPARATOR)];

  for (const row of rows) {
    const cells = [
      row.dataHora.toISOString(),
      row.acao,
      row.entidade ?? "",
      row.entidadeId ?? "",
      row.usuario?.nome ?? "",
      row.ip ?? "",
    ];
    lines.push(cells.map((cell) => escapeCsvValue(String(cell))).join(CSV_SEPARATOR));
  }

  return lines.join(CSV_NEWLINE);
}
