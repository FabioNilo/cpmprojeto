import { AdminPage } from "@/components/layout/admin-page";
import { FormSection } from "@/components/forms/form-section";
import { DataTable, type Column } from "@/components/ui/data-table";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import { EnviarAvisoForm } from "@/modules/notificacoes/components/enviar-aviso-form";
import { AtenderSolicitacaoSenhaForm } from "@/modules/responsaveis/components/atender-solicitacao-senha-form";
import { CreateResponsavelForm } from "@/modules/responsaveis/components/create-responsavel-form";
import { RegenerarSenhaForm } from "@/modules/responsaveis/components/regenerar-senha-form";
import { ToggleResponsavelAccessForm } from "@/modules/responsaveis/components/toggle-responsavel-access-form";
import { UpdateResponsavelForm } from "@/modules/responsaveis/components/update-responsavel-form";
import { listResponsaveisByColegio } from "@/modules/responsaveis/queries/list-responsaveis";
import { listSolicitacoesSenhaPendentes } from "@/modules/responsaveis/queries/list-solicitacoes-senha";
import { listTurmasAtivasOptions } from "@/modules/turmas/queries/list-turmas-options";
import {
  salasDistintas,
  salasPorSerie,
  seriesDistintas,
} from "@/modules/turmas/services/turma-nome";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

export default async function ResponsaveisPage() {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_READ);
  const canManageResponsaveis = context.permissoes.includes(
    PERMISSIONS.RESPONSAVEIS_MANAGE,
  );
  const [responsaveis, turmas, solicitacoesPendentes] = await Promise.all([
    listResponsaveisByColegio(context.colegioId),
    listTurmasAtivasOptions(context.colegioId),
    canManageResponsaveis
      ? listSolicitacoesSenhaPendentes(context.colegioId)
      : Promise.resolve([]),
  ]);
  const nomesTurmas = turmas.map((t) => t.nome);
  type ResponsavelRow = (typeof responsaveis)[number];
  const columns: Column<ResponsavelRow>[] = [
    {
      header: "Nome",
      render: (responsavel) => responsavel.usuario.nome,
    },
    {
      header: "Login",
      render: (responsavel) =>
        responsavel.usuario.username ??
        responsavel.usuario.email ??
        responsavel.usuario.cpf,
    },
    {
      header: "Telefone",
      render: (responsavel) => responsavel.telefone ?? "-",
    },
    {
      header: "Alunos",
      render: (responsavel) =>
        responsavel.alunos.map((vinculo) => vinculo.aluno.nome).join(", "),
    },
    {
      header: "Acesso CPM",
      render: (responsavel) =>
        responsavel.usuario.colegios[0]?.ativo ? "Ativo" : "Inativo",
    },
  ];

  if (canManageResponsaveis) {
    columns.push({
      header: "Ações",
      render: (responsavel) => (
        <div className="flex flex-col gap-2">
          <ToggleResponsavelAccessForm
            ativo={Boolean(responsavel.usuario.colegios[0]?.ativo)}
            id={responsavel.id}
          />
          <RegenerarSenhaForm id={responsavel.id} />
          <EnviarAvisoForm responsavelId={responsavel.id} />
          <UpdateResponsavelForm
            cpf={responsavel.usuario.cpf}
            email={responsavel.usuario.email}
            id={responsavel.id}
            nome={responsavel.usuario.nome}
            telefone={responsavel.telefone}
            username={responsavel.usuario.username}
          />
        </div>
      ),
    });
  }

  return (
    <AdminPage
      description="Responsáveis vinculados a alunos do colégio ativo. O login do responsável é separado do autor declarado de manifestações futuras."
      eyebrow={context.colegioNome}
      title="Responsáveis"
    >
      {canManageResponsaveis && solicitacoesPendentes.length > 0 ? (
        <section className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-900">
            Solicitações de nova senha ({solicitacoesPendentes.length})
          </h2>
          <p className="mb-3 text-xs text-amber-800">
            Responsável sem e-mail cadastrado não recupera senha sozinho.
            Gere uma senha provisória e repasse por telefone.
          </p>
          <ul className="space-y-2">
            {solicitacoesPendentes.map((s) => (
              <li
                key={s.id}
                className="rounded-md border border-amber-200 bg-white p-3"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {s.usuario.nome}{" "}
                  <span className="font-normal text-slate-500">
                    ({s.usuario.username})
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  Solicitado em {formatarData(s.criadoEm)}
                  {s.usuario.responsavel?.telefone
                    ? ` · telefone ${s.usuario.responsavel.telefone}`
                    : ""}
                  {s.usuario.responsavel?.alunos.length
                    ? ` · aluno(s): ${s.usuario.responsavel.alunos
                        .map((a) => a.aluno.nome)
                        .join(", ")}`
                    : ""}
                </p>
                <div className="mt-2">
                  <AtenderSolicitacaoSenhaForm id={s.id} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {canManageResponsaveis ? (
        <FormSection
          description="Cria login de responsável e vincula ao aluno no contexto do CPM ativo."
          title="Novo responsável"
        >
          <CreateResponsavelForm
            salasPorSerie={salasPorSerie(nomesTurmas)}
            series={seriesDistintas(nomesTurmas)}
            todasSalas={salasDistintas(nomesTurmas)}
          />
        </FormSection>
      ) : null}
      <DataTable
        columns={columns}
        emptyMessage="Nenhum responsável vinculado ao colégio ativo."
        getRowId={(responsavel) => responsavel.id}
        rows={responsaveis}
      />
    </AdminPage>
  );
}
