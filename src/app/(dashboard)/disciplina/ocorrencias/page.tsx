import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listOcorrencias } from "@/modules/disciplina/queries/list-ocorrencias";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requireAnyPermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

export default async function OcorrenciasPage() {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_READ_OWN,
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  ]);
  const podeVerEscola = context.permissoes.includes(
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  );
  const podeCriar = context.permissoes.includes(PERMISSIONS.OCORRENCIAS_CREATE);

  const ocorrencias = await listOcorrencias(context.colegioId, {
    escopo: podeVerEscola ? "SCHOOL" : "OWN",
    usuarioId: context.usuarioId,
  });

  type Row = (typeof ocorrencias)[number];
  const numeroLabel = (row: Row) => {
    if (!row.numero) return "(rascunho)";
    const extras = row._count.alunos - 1;
    return extras > 0 ? `${row.numero} +${extras}` : row.numero;
  };
  const columns: Column<Row>[] = [
    { header: "Número", render: numeroLabel },
    { header: "Tipo", render: (row) => row.tipo },
    { header: "Status", render: (row) => row.status },
    {
      header: "Data do fato",
      render: (row) => formatarData(row.dataOcorrencia),
    },
    { header: "Comunicante", render: (row) => row.comunicante.nome },
    {
      header: "Alunos",
      render: (row) => {
        const nomes = row.alunos.map((item) => item.aluno.nome).join(", ");
        return row._count.alunos > row.alunos.length
          ? `${nomes} (+${row._count.alunos - row.alunos.length})`
          : nomes;
      },
    },
    {
      header: "Detalhe",
      render: (row) => (
        <Link
          className="font-semibold text-navy-800 hover:underline"
          href={`/disciplina/ocorrencias/${row.id}`}
        >
          Abrir
        </Link>
      ),
    },
  ];

  return (
    <AdminPage
      description={
        podeVerEscola
          ? "Ocorrências disciplinares do colégio ativo. Uma comunicação registra um fato, não uma sanção."
          : "Ocorrências que você comunicou. Uma comunicação registra um fato, não uma sanção."
      }
      eyebrow="Disciplina"
      title="Ocorrências"
    >
      {podeCriar ? (
        <div className="mb-4">
          <Link
            className="inline-flex h-10 items-center rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
            href="/disciplina/ocorrencias/nova"
          >
            Nova comunicação
          </Link>
        </div>
      ) : null}
      <DataTable
        columns={columns}
        emptyMessage="Nenhuma ocorrência."
        getRowId={(row) => row.id}
        mobileHideColumns={["Número", "Detalhe"]}
        mobileHref={(row) => `/disciplina/ocorrencias/${row.id}`}
        mobileTitle={numeroLabel}
        rows={ocorrencias}
      />
    </AdminPage>
  );
}
