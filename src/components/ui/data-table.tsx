import Link from "next/link";

export type Column<T> = {
  header: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  emptyMessage: string;
  getRowId: (row: T) => string;
  // Mobile (< md): cada linha vira um card. `mobileTitle` e o cabecalho do card;
  // `mobileHideColumns` omite colunas (por header) do corpo do card;
  // `mobileHref` torna o card inteiro um link.
  mobileTitle?: (row: T) => React.ReactNode;
  mobileHideColumns?: string[];
  mobileHref?: (row: T) => string;
};

export function DataTable<T>({
  rows,
  columns,
  emptyMessage,
  getRowId,
  mobileTitle,
  mobileHideColumns,
  mobileHref,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600 sm:p-8">
        {emptyMessage}
      </div>
    );
  }

  const ocultas = new Set(mobileHideColumns ?? []);
  const colunasCard = columns.filter((c) => !ocultas.has(c.header));

  return (
    <>
      {/* Mobile: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const corpo = (
            <>
              {mobileTitle ? (
                <div className="mb-2 text-sm font-semibold text-slate-900">
                  {mobileTitle(row)}
                </div>
              ) : null}
              <dl className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3 gap-y-1 text-sm">
                {colunasCard.map((column) => (
                  <div key={column.header} className="contents">
                    <dt className="text-slate-500">{column.header}</dt>
                    <dd className="min-w-0 break-words text-slate-800">
                      {column.render(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          );
          const classe =
            "block rounded-lg border border-slate-200 bg-white p-4" +
            (mobileHref ? " active:bg-slate-50" : "");
          return (
            <li key={getRowId(row)}>
              {mobileHref ? (
                <Link className={classe} href={mobileHref(row)}>
                  {corpo}
                </Link>
              ) : (
                <div className={classe}>{corpo}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop: tabela */}
      <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    className="px-4 py-3 text-left font-semibold text-slate-700"
                    key={column.header}
                    scope="col"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr className="hover:bg-slate-50" key={getRowId(row)}>
                  {columns.map((column) => (
                    <td
                      className="align-top px-4 py-3 text-slate-700"
                      key={column.header}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
