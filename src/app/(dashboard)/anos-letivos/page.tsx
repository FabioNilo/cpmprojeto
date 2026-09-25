import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CreateAnoLetivoForm } from "@/modules/anos-letivos/components/create-ano-letivo-form";
import { ToggleAnoLetivoForm } from "@/modules/anos-letivos/components/toggle-ano-letivo-form";
import { listAnosLetivos } from "@/modules/anos-letivos/queries/list-anos-letivos";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export default async function AnosLetivosPage() {
  const context = await requirePermission(PERMISSIONS.ANOS_LETIVOS_MANAGE);
  const anosLetivos = await listAnosLetivos(context.colegioId);

  type AnoLetivoRow = (typeof anosLetivos)[number];
  const columns: Column<AnoLetivoRow>[] = [
    { header: "Ano", render: (ano) => ano.ano },
    {
      header: "Status",
      render: (ano) => (ano.ativo ? "Aberto" : "Encerrado"),
    },
    { header: "Turmas", render: (ano) => ano._count.turmas },
    { header: "Matrículas", render: (ano) => ano._count.matriculas },
    {
      header: "Ações",
      render: (ano) => <ToggleAnoLetivoForm ativo={ano.ativo} id={ano.id} />,
    },
  ];

  return (
    <AdminPage
      description="Anos letivos do colégio ativo. Um ano encerrado bloqueia novas matrículas naquele período, mas preserva o histórico."
      eyebrow={context.colegioNome}
      title="Anos letivos"
    >
      <FormSection
        description="Abre um ano letivo no colégio ativo. Se já existir, ele é reaberto."
        title="Novo ano letivo"
      >
        <CreateAnoLetivoForm />
      </FormSection>
      <DataTable
        columns={columns}
        emptyMessage="Nenhum ano letivo cadastrado no colégio ativo."
        getRowId={(ano) => ano.id}
        rows={anosLetivos}
      />
    </AdminPage>
  );
}
