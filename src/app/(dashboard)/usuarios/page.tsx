import { AdminPage } from "@/components/layout/admin-page";
import { FormSection } from "@/components/forms/form-section";
import { DataTable } from "@/components/ui/data-table";
import { GerarLinkTemporarioForm } from "@/modules/auth/components/gerar-link-temporario-form";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { listSolicitacoesSenhaEquipe } from "@/modules/responsaveis/queries/list-solicitacoes-senha";
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
  const [usuarios, perfis, solicitacoesPendentes] = await Promise.all([
    listUsuariosByColegio(context.colegioId, isAdministrador),
    listPerfisAtivos(isAdministrador),
    listSolicitacoesSenhaEquipe(context.colegioId, isAdministrador),
  ]);

  return (
    <AdminPage
      description="Usuários vinculados ao colégio ativo. O perfil é sempre avaliado dentro deste contexto de colégio."
      eyebrow={context.colegioNome}
      title="Usuários"
    >
      {solicitacoesPendentes.length > 0 ? (
        <section className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Solicitações de nova senha ({solicitacoesPendentes.length})
          </h2>
          <p className="mb-3 text-xs text-amber-800">
            Gere um link temporário e envie à própria pessoa por WhatsApp ou
            outro contato direto. O pedido é marcado como atendido ao gerar.
          </p>
          <ul className="space-y-2">
            {solicitacoesPendentes.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-amber-200 bg-white p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {s.usuario.posto
                    ? `${s.usuario.posto} ${s.usuario.nome}`
                    : s.usuario.nome}{" "}
                  <span className="font-normal text-slate-500">
                    ({s.usuario.username})
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Solicitado em{" "}
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(s.criadoEm)}
                </p>
                <div className="mt-2">
                  <GerarLinkTemporarioForm
                    origem="EQUIPE"
                    usuarioId={s.usuario.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
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
                {usuario.ativo ? (
                  <GerarLinkTemporarioForm
                    origem="EQUIPE"
                    usuarioId={usuario.id}
                  />
                ) : null}
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
