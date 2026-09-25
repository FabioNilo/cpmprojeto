import { AdminPage } from "@/components/layout/admin-page";
import { FormSection } from "@/components/forms/form-section";
import { DataTable } from "@/components/ui/data-table";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { listPerfisAtivos } from "@/modules/rbac/queries/list-perfis";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import { CreateUsuarioForm } from "@/modules/usuarios/components/create-usuario-form";
import { ToggleUsuarioForm } from "@/modules/usuarios/components/toggle-usuario-form";
import { UpdateUsuarioForm } from "@/modules/usuarios/components/update-usuario-form";
import { listUsuariosByColegio } from "@/modules/usuarios/queries/list-usuarios";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const context = await requirePermission(PERMISSIONS.USUARIOS_MANAGE);
  const isAdministrador = context.perfis.includes(ROLE_CODES.ADMINISTRADOR);
  const [usuarios, perfis] = await Promise.all([
    listUsuariosByColegio(context.colegioId, isAdministrador),
    listPerfisAtivos(isAdministrador),
  ]);

  return (
    <AdminPage
      description="Usuários vinculados ao colégio ativo. O perfil é sempre avaliado dentro deste contexto de colégio."
      eyebrow={context.colegioNome}
      title="Usuários"
    >
      <FormSection
        description="Cria usuário interno e vincula um perfil ao colégio ativo."
        title="Novo usuário"
      >
        <CreateUsuarioForm perfis={perfis} />
      </FormSection>
      <DataTable
        columns={[
          {
            header: "Nome",
            render: (usuario) =>
              usuario.posto ? `${usuario.posto} ${usuario.nome}` : usuario.nome,
          },
          {
            header: "Login",
            render: (usuario) =>
              usuario.username ?? usuario.email ?? usuario.cpf,
          },
          {
            header: "Perfis",
            render: (usuario) =>
              usuario.colegios[0]?.perfis
                .map((usuarioPerfil) => usuarioPerfil.perfil.codigo)
                .join(", ") || "-",
          },
          {
            header: "Status",
            render: (usuario) => (usuario.ativo ? "Ativo" : "Inativo"),
          },
          {
            header: "Ações",
            render: (usuario) => (
              <div className="flex flex-col gap-2">
                <ToggleUsuarioForm ativo={usuario.ativo} id={usuario.id} />
                <UpdateUsuarioForm
                  cpf={usuario.cpf}
                  email={usuario.email}
                  id={usuario.id}
                  nome={usuario.nome}
                  perfilId={usuario.colegios[0]?.perfis[0]?.perfilId}
                  perfis={perfis}
                  posto={usuario.posto}
                  username={usuario.username}
                />
              </div>
            ),
          },
        ]}
        emptyMessage="Nenhum usuario vinculado ao colegio ativo."
        getRowId={(usuario) => usuario.id}
        rows={usuarios}
      />
    </AdminPage>
  );
}
