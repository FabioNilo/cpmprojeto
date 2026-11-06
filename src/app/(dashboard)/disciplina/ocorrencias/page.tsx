import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { STATUS_OCORRENCIA } from "@/modules/disciplina/constants";
import { listOcorrencias } from "@/modules/disciplina/queries/list-ocorrencias";
import {
  resolverPeriodo,
  ROTULO_STATUS_OCORRENCIA,
} from "@/modules/disciplina/services/painel-gestao-rules";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requireAnyPermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

type SearchParams = Record<string, string | string[] | undefined>;

export default async function OcorrenciasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_READ_OWN,
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  ]);
  const podeVerEscola = context.permissoes.includes(
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  );
  const podeCriar = context.permissoes.includes(PERMISSIONS.OCORRENCIAS_CREATE);

  // Filtro vindo do painel de gestao. Valor invalido e ignorado.
  const params = await searchParams;
  const status = STATUS_OCORRENCIA.find((s) => s === params.status);
  const agora = new Date();
  const periodo = resolverPeriodo(
    {
      periodo: "livre",
      de: typeof params.de === "string" ? params.de : undefined,
      ate: typeof params.ate === "string" ? params.ate : undefined,
    },
    agora.getFullYear(),
    agora,
  );
  const temPeriodo = periodo.preset === "livre";

  const ocorrencias = await listOcorrencias(context.colegioId, {
    escopo: podeVerEscola ? "SCHOOL" : "OWN",
    usuarioId: context.usuarioId,
    status,
    dataInicio: temPeriodo ? periodo.inicio : undefined,
    dataFimExclusivo: temPeriodo ? periodo.fimExclusivo : undefined,
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
      {status || temPeriodo ? (
        <p className="mb-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          Filtro:
          {status ? ` ${ROTULO_STATUS_OCORRENCIA[status]}` : ""}
          {status && temPeriodo ? " ·" : ""}
          {temPeriodo ? ` ${periodo.rotulo}` : ""}
          {ocorrencias.length === 100 ? " · 100 mais recentes" : ""}.{" "}
          <Link
            className="font-semibold text-navy-800 hover:underline"
            href="/disciplina/ocorrencias"
          >
            Limpar filtro
          </Link>
        </p>
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
