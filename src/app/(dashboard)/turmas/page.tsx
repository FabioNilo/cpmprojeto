import { AdminPage } from "@/components/layout/admin-page";
import { FormSection } from "@/components/forms/form-section";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import { CreateTurmaForm } from "@/modules/turmas/components/create-turma-form";
import { ToggleTurmaForm } from "@/modules/turmas/components/toggle-turma-form";
import { UpdateTurmaForm } from "@/modules/turmas/components/update-turma-form";
import { listTurmasByColegio } from "@/modules/turmas/queries/list-turmas";

export const dynamic = "force-dynamic";

export default async function TurmasPage() {
  const context = await requirePermission(PERMISSIONS.TURMAS_READ);
  const canManageTurmas = context.permissoes.includes(
    PERMISSIONS.TURMAS_MANAGE,
  );
  const turmas = await listTurmasByColegio(context.colegioId);
  type TurmaRow = (typeof turmas)[number];
  const columns: Column<TurmaRow>[] = [
    { header: "Nome", render: (turma) => turma.nome },
    { header: "Ano letivo", render: (turma) => turma.anoLetivo.ano },
    { header: "Turno", render: (turma) => turma.turno ?? "-" },
    {
      header: "Matrículas",
      render: (turma) => turma._count.matriculas,
    },
    {
      header: "Status",
      render: (turma) => (turma.ativa ? "Ativa" : "Inativa"),
    },
  ];

  if (canManageTurmas) {
    columns.push({
      header: "Ações",
      render: (turma) => (
        <div className="flex flex-col gap-2">
          <ToggleTurmaForm ativa={turma.ativa} id={turma.id} />
          <UpdateTurmaForm
            ano={turma.anoLetivo.ano}
            id={turma.id}
            nome={turma.nome}
            turno={turma.turno}
          />
        </div>
      ),
    });
  }

  return (
    <AdminPage
      description="Turmas do colégio ativo por ano letivo. Matrículas são vínculos administrativos, ainda sem efeito disciplinar nesta etapa."
      eyebrow={context.colegioNome}
      title="Turmas"
    >
      {canManageTurmas ? (
        <FormSection
          description="Cria turma no colégio ativo e abre o ano letivo quando necessário."
          title="Nova turma"
        >
          <CreateTurmaForm />
        </FormSection>
      ) : null}
      <DataTable
        columns={columns}
        emptyMessage="Nenhuma turma cadastrada no colegio ativo."
        getRowId={(turma) => turma.id}
        rows={turmas}
      />
    </AdminPage>
  );
}
