import { AdminPage } from "@/components/layout/admin-page";
import { FormSection } from "@/components/forms/form-section";
import { DataTable } from "@/components/ui/data-table";
import { CreateColegioForm } from "@/modules/colegios/components/create-colegio-form";
import { ToggleColegioForm } from "@/modules/colegios/components/toggle-colegio-form";
import { UpdateColegioForm } from "@/modules/colegios/components/update-colegio-form";
import { listColegios } from "@/modules/colegios/queries/list-colegios";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export default async function ColegiosPage() {
  await requirePermission(PERMISSIONS.COLEGIOS_MANAGE);
  const colegios = await listColegios();

  return (
    <AdminPage
      description="Lista inicial dos colégios cadastrados. A gestão completa será adicionada em uma etapa incremental."
      eyebrow="Administração"
      title="Colégios"
    >
      <FormSection
        description="Cria uma unidade CPM para uso administrativo e futuro isolamento por tenant."
        title="Novo colégio"
      >
        <CreateColegioForm />
      </FormSection>
      <DataTable
        columns={[
          { header: "Nome", render: (colegio) => colegio.nome },
          { header: "Código", render: (colegio) => colegio.codigo },
          {
            header: "Status",
            render: (colegio) => (colegio.ativo ? "Ativo" : "Inativo"),
          },
          {
            header: "Usuários",
            render: (colegio) => colegio._count.usuarios,
          },
          { header: "Alunos", render: (colegio) => colegio._count.alunos },
          { header: "Turmas", render: (colegio) => colegio._count.turmas },
          {
            header: "Ações",
            render: (colegio) => (
              <div className="flex flex-col gap-2">
                <ToggleColegioForm ativo={colegio.ativo} id={colegio.id} />
                <UpdateColegioForm
                  codigo={colegio.codigo}
                  id={colegio.id}
                  nome={colegio.nome}
                />
              </div>
            ),
          },
        ]}
        emptyMessage="Nenhum colégio cadastrado."
        getRowId={(colegio) => colegio.id}
        rows={colegios}
      />
    </AdminPage>
  );
}
