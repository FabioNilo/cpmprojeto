import Link from "next/link";

import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CreateAlunoForm } from "@/modules/alunos/components/create-aluno-form";
import { FiltroTurmaSala } from "@/modules/alunos/components/filtro-turma-sala";
import { TransferAlunoForm } from "@/modules/alunos/components/transfer-aluno-form";
import { UpdateAlunoForm } from "@/modules/alunos/components/update-aluno-form";
import { UpdateAlunoVinculoStatusForm } from "@/modules/alunos/components/update-aluno-vinculo-status-form";
import { searchAlunos } from "@/modules/alunos/queries/search-alunos";
import { listColegioTransferOptions } from "@/modules/colegios/queries/list-colegios-options";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import {
  listTurmasAtivasOptions,
  listTurmasAtivasTransferOptions,
} from "@/modules/turmas/queries/list-turmas-options";
import {
  salasDistintas,
  salasPorSerie,
  seriesDistintas,
} from "@/modules/turmas/services/turma-nome";

export const dynamic = "force-dynamic";

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{
    serie?: string;
    sala?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const context = await requirePermission(PERMISSIONS.ALUNOS_READ);
  const { serie, sala, q, page } = await searchParams;

  const canManageAlunos = context.permissoes.includes(PERMISSIONS.ALUNOS_MANAGE);
  const canTransferAlunos = context.permissoes.includes(
    PERMISSIONS.ALUNOS_TRANSFER,
  );

  const [resultado, turmas, colegiosDestino, turmasDestino] = await Promise.all([
    searchAlunos(context.colegioId, {
      serie,
      sala,
      termo: q,
      page: page ? Number(page) : 1,
      exigirFiltro: true,
    }),
    listTurmasAtivasOptions(context.colegioId),
    canTransferAlunos
      ? listColegioTransferOptions(context.colegioId)
      : Promise.resolve([]),
    canTransferAlunos
      ? listTurmasAtivasTransferOptions(context.colegioId)
      : Promise.resolve([]),
  ]);

  const nomesTurmas = turmas.map((t) => t.nome);
  const defaultTransferDate = new Date().toISOString().slice(0, 10);

  const alunosParaTransferencia = resultado.linhas
    .filter((a) => a.vinculoStatus === "ATIVO")
    .map((a) => ({
      id: a.id,
      nome: a.nome,
      matriculaGeral: a.matriculaGeral,
    }));

  type Linha = (typeof resultado.linhas)[number];
  const columns: Column<Linha>[] = [
    { header: "Nome", render: (a) => a.nome },
    { header: "Matrícula geral", render: (a) => a.matriculaGeral ?? "-" },
    { header: "Turma / Sala", render: (a) => a.turma ?? "-" },
    { header: "Vínculo CPM", render: (a) => a.vinculoStatus ?? "-" },
    {
      header: "Necessidade especial",
      render: (a) => (a.necessidadeEspecial ? "Sim" : "-"),
    },
  ];
  if (canManageAlunos) {
    columns.push({
      header: "Ações",
      render: (a) => (
        <div className="flex flex-col gap-2">
          {a.vinculoId ? (
            <UpdateAlunoVinculoStatusForm
              status={a.vinculoStatus ?? "ATIVO"}
              vinculoId={a.vinculoId}
            />
          ) : null}
          <UpdateAlunoForm
            id={a.id}
            matriculaGeral={a.matriculaGeral}
            necessidadeEspecial={a.necessidadeEspecial}
            nome={a.nome}
          />
        </div>
      ),
    });
  }

  const paramsBase = new URLSearchParams();
  if (serie) paramsBase.set("serie", serie);
  if (sala) paramsBase.set("sala", sala);
  if (q) paramsBase.set("q", q);
  const linkPagina = (p: number) => {
    const sp = new URLSearchParams(paramsBase);
    sp.set("page", String(p));
    return `/alunos?${sp.toString()}`;
  };

  return (
    <AdminPage
      description="Consulta de alunos do colégio ativo. Use os filtros de turma, sala ou nome — os dados são carregados sob demanda."
      eyebrow={context.colegioNome}
      title="Alunos"
    >
      {canManageAlunos ? (
        <FormSection
          description="Cria ou vincula uma identidade de aluno ao CPM ativo sem duplicar histórico futuro."
          title="Novo aluno ou vínculo"
        >
          <CreateAlunoForm turmas={turmas} />
        </FormSection>
      ) : null}
      {canTransferAlunos ? (
        <FormSection
          description="Filtre o aluno na lista abaixo para habilitá-lo aqui. Transfere aluno ativo do CPM de origem para outro CPM, preservando a matrícula geral."
          title="Transferência entre CPMs"
        >
          <TransferAlunoForm
            alunos={alunosParaTransferencia}
            colegiosDestino={colegiosDestino}
            defaultDate={defaultTransferDate}
            turmasDestino={turmasDestino}
          />
        </FormSection>
      ) : null}

      <FiltroTurmaSala
        defaults={{ serie, sala, termo: q }}
        salasPorSerie={salasPorSerie(nomesTurmas)}
        series={seriesDistintas(nomesTurmas)}
        todasSalas={salasDistintas(nomesTurmas)}
      />

      {resultado.filtrou ? (
        <>
          <p className="mb-2 text-sm text-slate-600">
            {resultado.total} aluno(s) · página {resultado.page} de{" "}
            {resultado.totalPaginas}
          </p>
          <DataTable
            columns={columns}
            emptyMessage="Nenhum aluno para os filtros informados."
            getRowId={(a) => a.id}
            mobileHideColumns={["Nome"]}
            mobileTitle={(a) => a.nome}
            rows={resultado.linhas}
          />
          {resultado.totalPaginas > 1 ? (
            <div className="mt-3 flex gap-2 text-sm">
              {resultado.page > 1 ? (
                <Link
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5"
                  href={linkPagina(resultado.page - 1)}
                >
                  Anterior
                </Link>
              ) : null}
              {resultado.page < resultado.totalPaginas ? (
                <Link
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5"
                  href={linkPagina(resultado.page + 1)}
                >
                  Próxima
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Selecione uma turma, sala ou informe um nome para listar os alunos.
        </p>
      )}
    </AdminPage>
  );
}
