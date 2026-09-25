import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CancelarMatriculaForm } from "@/modules/matriculas/components/cancelar-matricula-form";
import { CreateMatriculaForm } from "@/modules/matriculas/components/create-matricula-form";
import { ReativarMatriculaForm } from "@/modules/matriculas/components/reativar-matricula-form";
import { TransferirTurmaForm } from "@/modules/matriculas/components/transferir-turma-form";
import { listMatriculas } from "@/modules/matriculas/queries/list-matriculas";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import { listTurmasAtivasOptions } from "@/modules/turmas/queries/list-turmas-options";
import {
  salasDistintas,
  salasPorSerie,
  seriesDistintas,
} from "@/modules/turmas/services/turma-nome";

export const dynamic = "force-dynamic";

export default async function MatriculasPage() {
  const context = await requirePermission(PERMISSIONS.MATRICULAS_READ);
  const canManage = context.permissoes.includes(PERMISSIONS.MATRICULAS_MANAGE);

  const [matriculas, turmas] = await Promise.all([
    listMatriculas(context.colegioId),
    canManage
      ? listTurmasAtivasOptions(context.colegioId)
      : Promise.resolve([]),
  ]);
  const nomesTurmas = turmas.map((t) => t.nome);

  type MatriculaRow = (typeof matriculas)[number];
  const columns: Column<MatriculaRow>[] = [
    { header: "Aluno", render: (matricula) => matricula.aluno.nome },
    {
      header: "Matrícula geral",
      render: (matricula) => matricula.aluno.matriculaGeral ?? "-",
    },
    { header: "Turma", render: (matricula) => matricula.turma.nome },
    { header: "Ano", render: (matricula) => matricula.anoLetivo.ano },
    { header: "Número", render: (matricula) => matricula.numero ?? "-" },
    {
      header: "Vínculo CPM",
      render: (matricula) => matricula.alunoVinculoColegio.status,
    },
    {
      header: "Status",
      render: (matricula) => (matricula.ativa ? "Ativa" : "Cancelada"),
    },
  ];

  if (canManage) {
    columns.push({
      header: "Ações",
      render: (matricula) => (
        <div className="flex flex-col gap-2">
          {matricula.ativa ? (
            <>
              <TransferirTurmaForm matriculaId={matricula.id} turmas={turmas} />
              <CancelarMatriculaForm matriculaId={matricula.id} />
            </>
          ) : (
            <ReativarMatriculaForm matriculaId={matricula.id} />
          )}
        </div>
      ),
    });
  }

  return (
    <AdminPage
      description="Matrículas do colégio ativo por ano letivo. A matrícula liga o aluno a uma turma e será a âncora da pontuação disciplinar."
      eyebrow={context.colegioNome}
      title="Matrículas"
    >
      {canManage ? (
        <FormSection
          description="Matrícula um aluno com vínculo ativo em uma turma de ano letivo aberto."
          title="Nova matrícula"
        >
          <CreateMatriculaForm
            salasPorSerie={salasPorSerie(nomesTurmas)}
            series={seriesDistintas(nomesTurmas)}
            todasSalas={salasDistintas(nomesTurmas)}
            turmas={turmas}
          />
        </FormSection>
      ) : null}
      <DataTable
        columns={columns}
        emptyMessage="Nenhuma matrícula no colégio ativo."
        getRowId={(matricula) => matricula.id}
        rows={matriculas}
      />
    </AdminPage>
  );
}
