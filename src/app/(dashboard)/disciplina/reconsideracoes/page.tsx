import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listReconsideracoes } from "@/modules/disciplina/queries/list-reconsideracoes";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requireAnyPermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(valor);
}

export default async function ReconsideracoesPage({
  searchParams,
}: {
  searchParams: Promise<{ todas?: string }>;
}) {
  const context = await requireAnyPermission([
    PERMISSIONS.RECONSIDERACOES_DECIDE,
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  ]);
  const { todas } = await searchParams;
  const apenasPendentes = todas !== "1";

  const linhas = await listReconsideracoes(context.colegioId, apenasPendentes);

  type Linha = (typeof linhas)[number];
  const columns: Column<Linha>[] = [
    {
      header: "Aluno",
      render: (row) => (
        <Link
          className="font-medium text-navy-900 hover:underline"
          href={`/disciplina/ocorrencias/${row.ocorrenciaAluno.ocorrenciaId}`}
        >
          {row.ocorrenciaAluno.aluno.nome}
        </Link>
      ),
    },
    {
      header: "Processo",
      render: (row) => row.ocorrenciaAluno.numeroProcesso ?? "-",
    },
    {
      header: "Sanção",
      render: (row) =>
        `${row.sancao.tipoSancaoCodigo} (${row.sancao.status})`,
    },
    {
      header: "Natureza",
      render: (row) => row.sancao.decisao.naturezaApurada ?? "-",
    },
    { header: "Status", render: (row) => row.status },
    { header: "Prazo", render: (row) => formatarData(row.prazoFinal) },
    { header: "Solicitante", render: (row) => row.solicitante.nome },
  ];

  return (
    <AdminPage
      description="Pedidos de reconsideração do colégio ativo. A competência varia pela natureza (anexo A, seção 12)."
      eyebrow="Disciplina"
      title="Reconsiderações"
    >
      <div className="mb-4 flex gap-2 text-sm">
        <Link
          className={`rounded-md border px-3 py-1.5 ${
            apenasPendentes
              ? "border-navy-900 bg-navy-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
          href="/disciplina/reconsideracoes"
        >
          Pendentes
        </Link>
        <Link
          className={`rounded-md border px-3 py-1.5 ${
            !apenasPendentes
              ? "border-navy-900 bg-navy-900 text-white"
              : "border-slate-300 bg-white text-slate-700"
          }`}
          href="/disciplina/reconsideracoes?todas=1"
        >
          Todas
        </Link>
      </div>

      <DataTable
        columns={columns}
        emptyMessage="Nenhuma reconsideração."
        getRowId={(row) => row.id}
        mobileHideColumns={["Aluno"]}
        mobileHref={(row) =>
          `/disciplina/ocorrencias/${row.ocorrenciaAluno.ocorrenciaId}`
        }
        mobileTitle={(row) => row.ocorrenciaAluno.aluno.nome}
        rows={linhas}
      />
    </AdminPage>
  );
}
