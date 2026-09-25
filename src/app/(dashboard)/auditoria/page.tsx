import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { AuditoriaFiltros } from "@/modules/auditoria/components/auditoria-filtros";
import { listAuditoria, listAuditoriaFacets } from "@/modules/auditoria/queries/list-auditoria";
import {
  auditoriaFiltersToQuery,
  parseAuditoriaFilters,
} from "@/modules/auditoria/schemas/auditoria-filter-schema";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function formatDataHora(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(value);
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await requirePermission(PERMISSIONS.AUDITORIA_READ);
  const filtros = parseAuditoriaFilters(await searchParams);
  const [resultado, facets] = await Promise.all([
    listAuditoria(context.colegioId, filtros),
    listAuditoriaFacets(context.colegioId),
  ]);
  const { registros, total, totalPaginas, pagina } = resultado;

  const baseQuery = auditoriaFiltersToQuery(filtros);
  const exportQuery = baseQuery.toString();

  const pageHref = (target: number) => {
    const params = new URLSearchParams(baseQuery);
    params.set("pagina", String(target));
    return `/auditoria?${params.toString()}`;
  };

  type RegistroRow = (typeof registros)[number];
  const columns: Column<RegistroRow>[] = [
    {
      header: "Data e hora",
      render: (registro) => formatDataHora(registro.dataHora),
    },
    { header: "Ação", render: (registro) => registro.acao },
    { header: "Entidade", render: (registro) => registro.entidade ?? "-" },
    {
      header: "Registro",
      render: (registro) => registro.entidadeId ?? "-",
    },
    {
      header: "Usuário",
      render: (registro) => registro.usuario?.nome ?? "-",
    },
    { header: "IP", render: (registro) => registro.ip ?? "-" },
    {
      header: "Detalhe",
      render: (registro) => (
        <Link
          className="font-semibold text-navy-800 hover:underline"
          href={`/auditoria/${registro.id}`}
        >
          Ver
        </Link>
      ),
    },
  ];

  return (
    <AdminPage
      description="Registro de auditoria do colégio ativo e de eventos globais de sistema (login, acesso negado, alterações cadastrais, transferências)."
      eyebrow={context.colegioNome}
      title="Auditoria"
    >
      <AuditoriaFiltros
        acoes={facets.acoes}
        entidades={facets.entidades}
        filtros={filtros}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {total} registro(s) &middot; pagina {pagina} de {totalPaginas}
        </p>
        <a
          className="flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={
            exportQuery
              ? `/auditoria/export?${exportQuery}`
              : "/auditoria/export"
          }
        >
          Exportar CSV
        </a>
      </div>

      <DataTable
        columns={columns}
        emptyMessage="Nenhum registro de auditoria para os filtros informados."
        getRowId={(registro) => registro.id}
        rows={registros}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        {pagina > 1 ? (
          <Link
            className="flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href={pageHref(pagina - 1)}
          >
            Anterior
          </Link>
        ) : (
          <span className="flex h-10 items-center px-4 text-sm text-slate-400">
            Anterior
          </span>
        )}
        {pagina < totalPaginas ? (
          <Link
            className="flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href={pageHref(pagina + 1)}
          >
            Proxima
          </Link>
        ) : (
          <span className="flex h-10 items-center px-4 text-sm text-slate-400">
            Proxima
          </span>
        )}
      </div>
    </AdminPage>
  );
}
