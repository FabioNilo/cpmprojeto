import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { getIndicadoresDisciplina } from "@/modules/disciplina/queries/get-indicadores";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

function Card({ label, value, alerta }: { label: string; value: number; alerta?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        alerta && value > 0
          ? "border-red-200 bg-red-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function PainelDisciplinarPage() {
  const context = await requirePermission(PERMISSIONS.COMPORTAMENTO_READ);
  const ind = await getIndicadoresDisciplina(context.colegioId);

  type Reincidente = (typeof ind.topReincidentes)[number];
  const colsReincidentes: Column<Reincidente>[] = [
    {
      header: "Aluno",
      render: (r) => (
        <Link
          className="font-medium text-navy-900 hover:underline"
          href={`/disciplina/comportamento/${r.alunoId}`}
        >
          {r.nome}
        </Link>
      ),
    },
    { header: "Matrícula", render: (r) => r.matricula },
    { header: "Processos procedentes", render: (r) => r.procedentes },
  ];

  return (
    <AdminPage
      description="Visão gerencial do colégio ativo: ocorrências, sanções, faixas e reincidência."
      eyebrow="Disciplina"
      title="Painel disciplinar"
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Alunos ativos" value={ind.totalAlunos} />
        <Card label="Em acompanhamento (< 6,00)" value={ind.emAcompanhamento} alerta />
        <Card label="Reconsiderações pendentes" value={ind.reconsideracoesPendentes} alerta />
        <Card label="Afastamentos ativos" value={ind.afastamentosAtivos} alerta />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-950">
            Distribuição por faixa
          </h2>
          <ul className="space-y-1 text-sm">
            {ind.distribuicaoFaixa.map((f) => (
              <li key={f.codigo} className="flex justify-between">
                <span className="text-slate-600">{f.nome}</span>
                <span className="font-semibold text-slate-900">{f.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-950">
            Processos por situação
          </h2>
          <ul className="space-y-1 text-sm">
            {ind.processosPorStatus.map((p) => (
              <li key={p.status} className="flex justify-between">
                <span className="text-slate-600">{p.status}</span>
                <span className="font-semibold text-slate-900">{p.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-950">
            Ocorrências por status
          </h2>
          <ul className="space-y-1 text-sm">
            {ind.ocorrenciasPorStatus.map((o) => (
              <li key={o.status} className="flex justify-between">
                <span className="text-slate-600">{o.status}</span>
                <span className="font-semibold text-slate-900">{o.total}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-950">
            Sanções por tipo
          </h2>
          <ul className="space-y-1 text-sm">
            {ind.sancoesPorTipo.length === 0 ? (
              <li className="text-slate-500">Nenhuma sanção registrada.</li>
            ) : (
              ind.sancoesPorTipo.map((s) => (
                <li key={`${s.tipo}-${s.status}`} className="flex justify-between">
                  <span className="text-slate-600">
                    {s.tipo} ({s.status})
                  </span>
                  <span className="font-semibold text-slate-900">{s.total}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <h2 className="mb-2 text-base font-semibold text-slate-950">
        Top reincidentes (processos procedentes)
      </h2>
      <DataTable
        columns={colsReincidentes}
        emptyMessage="Sem reincidência registrada."
        getRowId={(r) => r.alunoId}
        mobileHideColumns={["Aluno"]}
        mobileHref={(r) => `/disciplina/comportamento/${r.alunoId}`}
        mobileTitle={(r) => r.nome}
        rows={ind.topReincidentes}
      />
    </AdminPage>
  );
}
