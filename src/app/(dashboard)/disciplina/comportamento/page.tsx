import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ProcessarRestauracoesForm } from "@/modules/disciplina/components/comportamento-forms";
import { listComportamento } from "@/modules/disciplina/queries/list-comportamento";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import { listTurmasAtivasOptions } from "@/modules/turmas/queries/list-turmas-options";
import {
  salasDistintas,
  seriesDistintas,
} from "@/modules/turmas/services/turma-nome";

export const dynamic = "force-dynamic";

export default async function ComportamentoPage({
  searchParams,
}: {
  searchParams: Promise<{
    faixa?: string;
    acompanhamento?: string;
    serie?: string;
    sala?: string;
    q?: string;
    pagina?: string;
  }>;
}) {
  const context = await requirePermission(PERMISSIONS.COMPORTAMENTO_READ);
  const { faixa, acompanhamento, serie, sala, q, pagina } = await searchParams;
  const paginaPedida = Number(pagina) || 1;

  const [
    { linhas, faixas, totalAlunos, emAcompanhamento, paginaAtual, totalPaginas },
    turmas,
  ] = await Promise.all([
    listComportamento(
      context.colegioId,
      {
        faixaCodigo: faixa || undefined,
        somenteAcompanhamento: acompanhamento === "1",
        serie: serie || undefined,
        sala: sala || undefined,
        termo: q || undefined,
      },
      paginaPedida,
    ),
    listTurmasAtivasOptions(context.colegioId),
  ]);

  const nomesTurmas = turmas.map((t) => t.nome);
  const podeGerir = context.permissoes.includes(PERMISSIONS.PONTUACAO_MANAGE);

  const paramsPagina = (p: number) => {
    const sp = new URLSearchParams();
    if (faixa) sp.set("faixa", faixa);
    if (acompanhamento) sp.set("acompanhamento", acompanhamento);
    if (serie) sp.set("serie", serie);
    if (sala) sp.set("sala", sala);
    if (q) sp.set("q", q);
    sp.set("pagina", String(p));
    return `?${sp.toString()}`;
  };

  type Linha = (typeof linhas)[number];
  const columns: Column<Linha>[] = [
    {
      header: "Aluno",
      render: (row) => (
        <Link
          className="font-medium text-navy-900 hover:underline"
          href={`/disciplina/comportamento/${row.aluno.id}`}
        >
          {row.aluno.nome}
        </Link>
      ),
    },
    { header: "Matrícula", render: (row) => row.aluno.matriculaGeral ?? "-" },
    { header: "Turma / Sala", render: (row) => row.turma ?? "-" },
    { header: "Saldo", render: (row) => row.saldoBruto.toFixed(2) },
    { header: "Faixa", render: (row) => row.faixa?.nome ?? "-" },
    { header: "Movimentos", render: (row) => row.totalMovimentos },
    {
      header: "Acompanhamento",
      render: (row) =>
        row.exigeAcompanhamento ? (
          <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
            Sim
          </span>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <AdminPage
      description="Saldo e faixa de comportamento reconstruídos a partir do histórico de movimentos."
      eyebrow="Disciplina"
      title="Comportamento"
    >
      <p className="mb-4 text-sm text-slate-600">
        {totalAlunos} aluno(s) no recorte · {emAcompanhamento} em acompanhamento
        {totalPaginas > 1 ? ` · página ${paginaAtual} de ${totalPaginas}` : ""}
      </p>

      <form
        className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        method="get"
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Turma
          </span>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            defaultValue={serie ?? ""}
            name="serie"
          >
            <option value="">Todas</option>
            {seriesDistintas(nomesTurmas).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Sala
          </span>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            defaultValue={sala ?? ""}
            name="sala"
          >
            <option value="">Todas</option>
            {salasDistintas(nomesTurmas).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Nome / matrícula
          </span>
          <input
            className="h-10 rounded-md border border-slate-300 px-3 text-sm"
            defaultValue={q ?? ""}
            name="q"
            type="search"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Faixa
          </span>
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            defaultValue={faixa ?? ""}
            name="faixa"
          >
            <option value="">Todas</option>
            {faixas.map((f) => (
              <option key={f.codigo} value={f.codigo}>
                {f.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            defaultChecked={acompanhamento === "1"}
            name="acompanhamento"
            type="checkbox"
            value="1"
          />
          Só em acompanhamento
        </label>
        <button
          className="h-10 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white"
          type="submit"
        >
          Filtrar
        </button>
      </form>

      {podeGerir ? (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4">
          <ProcessarRestauracoesForm />
        </div>
      ) : null}

      <DataTable
        columns={columns}
        emptyMessage="Nenhum aluno para os filtros."
        getRowId={(row) => row.aluno.id}
        mobileHideColumns={["Aluno"]}
        mobileHref={(row) => `/disciplina/comportamento/${row.aluno.id}`}
        mobileTitle={(row) => row.aluno.nome}
        rows={linhas}
      />

      {totalPaginas > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {paginaAtual > 1 ? (
            <Link
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              href={paramsPagina(paginaAtual - 1)}
            >
              Anterior
            </Link>
          ) : null}
          <span className="text-slate-500">
            Página {paginaAtual} de {totalPaginas}
          </span>
          {paginaAtual < totalPaginas ? (
            <Link
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              href={paramsPagina(paginaAtual + 1)}
            >
              Próxima
            </Link>
          ) : null}
        </div>
      ) : null}
    </AdminPage>
  );
}
