import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CreatePerfilForm } from "@/modules/rbac/components/create-perfil-form";
import { PerfilPermissoesForm } from "@/modules/rbac/components/perfil-permissoes-form";
import { TogglePerfilForm } from "@/modules/rbac/components/toggle-perfil-form";
import { UpdatePerfilForm } from "@/modules/rbac/components/update-perfil-form";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { listPerfisAdmin } from "@/modules/rbac/queries/list-perfis-admin";
import { listPermissoes } from "@/modules/rbac/queries/list-permissoes";
import { PERFIS_COM_PERMISSOES_TRAVADAS } from "@/modules/rbac/services/rbac-admin-rules";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export default async function RbacPage() {
  const context = await requirePermission(PERMISSIONS.RBAC_MANAGE);
  const isAdministrador = context.perfis.includes(ROLE_CODES.ADMINISTRADOR);
  const [perfis, permissoes] = await Promise.all([
    listPerfisAdmin(isAdministrador),
    listPermissoes(),
  ]);

  type PerfilRow = (typeof perfis)[number];
  const columns: Column<PerfilRow>[] = [
    { header: "Código", render: (perfil) => perfil.codigo },
    { header: "Nome", render: (perfil) => perfil.nome },
    {
      header: "Tipo",
      render: (perfil) => (perfil.sistema ? "Sistema" : "Personalizado"),
    },
    {
      header: "Status",
      render: (perfil) => (perfil.ativo ? "Ativo" : "Inativo"),
    },
    { header: "Permissões", render: (perfil) => perfil.permissoes.length },
    { header: "Usuários", render: (perfil) => perfil.usuariosVinculados },
    {
      header: "Ações",
      render: (perfil) => (
        <div className="flex flex-col gap-2">
          <PerfilPermissoesForm
            atuais={perfil.permissoes}
            perfilId={perfil.id}
            permissoes={permissoes}
            travado={PERFIS_COM_PERMISSOES_TRAVADAS.includes(perfil.codigo)}
          />
          {perfil.sistema ? null : (
            <>
              <TogglePerfilForm ativo={perfil.ativo} id={perfil.id} />
              <UpdatePerfilForm
                descricao={perfil.descricao}
                id={perfil.id}
                nome={perfil.nome}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminPage
      description="Perfis e a matriz de permissões por perfil. Perfis de sistema têm identidade fixa, mas as permissões podem ser ajustadas (exceto ADMINISTRADOR). A atribuição de perfil a cada usuário continua na tela de Usuários."
      eyebrow="Administração"
      title="Perfis e permissões"
    >
      <FormSection
        description="Cria um perfil personalizado. O código é imutável e usado nas regras de autorização."
        title="Novo perfil"
      >
        <CreatePerfilForm />
      </FormSection>
      <DataTable
        columns={columns}
        emptyMessage="Nenhum perfil cadastrado."
        getRowId={(perfil) => String(perfil.id)}
        rows={perfis}
      />
    </AdminPage>
  );
}
