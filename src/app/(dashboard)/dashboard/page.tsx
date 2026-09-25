import Link from "next/link";

import { AdminPage } from "@/components/layout/admin-page";
import { prisma } from "@/db/prisma";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

type Atalho = {
  href: string;
  titulo: string;
  descricao: string;
  destaque?: string;
};

export default async function DashboardPage() {
  const context = await requirePermission(PERMISSIONS.DASHBOARD_ACCESS);
  const tem = (p: string) => context.permissoes.includes(p);

  const [
    rascunhos,
    reconsideracoesPendentes,
    aguardandoManifestacao,
    solicitacoesSenhaPendentes,
  ] = await Promise.all([
      tem(PERMISSIONS.OCORRENCIAS_CREATE)
        ? prisma.ocorrencia.count({
            where: {
              colegioId: context.colegioId,
              comunicanteId: context.usuarioId,
              status: "RASCUNHO",
            },
          })
        : Promise.resolve(0),
      tem(PERMISSIONS.RECONSIDERACOES_DECIDE)
        ? prisma.reconsideracao.count({
            where: {
              status: "PENDENTE",
              ocorrenciaAluno: { ocorrencia: { colegioId: context.colegioId } },
            },
          })
        : Promise.resolve(0),
      tem(PERMISSIONS.OCORRENCIAS_MANAGE)
        ? prisma.ocorrencia.count({
            where: {
              colegioId: context.colegioId,
              status: { in: ["EM_AVERIGUACAO", "AGUARDANDO_MANIFESTACAO"] },
            },
          })
        : Promise.resolve(0),
      tem(PERMISSIONS.RESPONSAVEIS_MANAGE)
        ? prisma.solicitacaoSenhaResponsavel.count({
            where: { colegioId: context.colegioId, atendidaEm: null },
          })
        : Promise.resolve(0),
    ]);

  const atalhos: Atalho[] = [];
  if (tem(PERMISSIONS.OCORRENCIAS_READ_OWN)) {
    atalhos.push({
      href: "/disciplina/ocorrencias",
      titulo: "Ocorrências",
      descricao: "Comunicações registradas e o andamento de cada processo.",
      destaque:
        rascunhos > 0
          ? `${rascunhos} rascunho(s) a enviar`
          : aguardandoManifestacao > 0
            ? `${aguardandoManifestacao} aguardando manifestação`
            : undefined,
    });
  }
  if (tem(PERMISSIONS.RECONSIDERACOES_DECIDE)) {
    atalhos.push({
      href: "/disciplina/reconsideracoes",
      titulo: "Reconsiderações",
      descricao: "Pedidos aguardando decisão da autoridade competente.",
      destaque:
        reconsideracoesPendentes > 0
          ? `${reconsideracoesPendentes} pendente(s)`
          : undefined,
    });
  }
  if (tem(PERMISSIONS.COMPORTAMENTO_READ)) {
    atalhos.push({
      href: "/disciplina/painel",
      titulo: "Painel disciplinar",
      descricao: "Indicadores do colégio: faixas, sanções e reincidência.",
    });
    atalhos.push({
      href: "/disciplina/comportamento",
      titulo: "Comportamento",
      descricao: "Saldo e faixa por aluno, com filtro por turma e sala.",
    });
  }
  if (tem(PERMISSIONS.RESPONSAVEIS_MANAGE)) {
    atalhos.push({
      href: "/responsaveis",
      titulo: "Responsáveis",
      descricao: "Cadastro de responsáveis e pedidos de nova senha.",
      destaque:
        solicitacoesSenhaPendentes > 0
          ? `${solicitacoesSenhaPendentes} pedido(s) de senha`
          : undefined,
    });
  }
  if (tem(PERMISSIONS.ALUNOS_READ)) {
    atalhos.push({
      href: "/alunos",
      titulo: "Alunos",
      descricao: "Consulta por turma, sala ou nome.",
    });
  }
  if (tem(PERMISSIONS.DISCIPLINA_CATALOGOS_READ)) {
    atalhos.push({
      href: "/disciplina/catalogos",
      titulo: "Catálogos disciplinares",
      descricao: "Transgressões, sanções, faixas e prazos.",
    });
  }
  if (tem(PERMISSIONS.AUDITORIA_READ)) {
    atalhos.push({
      href: "/auditoria",
      titulo: "Auditoria",
      descricao: "Trilha completa das ações no sistema.",
    });
  }

  return (
    <AdminPage
      description="Escolha uma área. As comunicações podem ser registradas direto do celular."
      eyebrow={context.colegioNome}
      title="Início"
    >
      {tem(PERMISSIONS.OCORRENCIAS_CREATE) ? (
        <Link
          className="mb-5 flex items-center justify-between rounded-xl bg-navy-900 p-5 text-white active:bg-navy-800"
          href="/disciplina/ocorrencias/nova"
        >
          <span>
            <span className="block text-base font-semibold">
              Nova comunicação
            </span>
            <span className="block text-sm text-white/80">
              Registrar um fato disciplinar
            </span>
          </span>
          <span aria-hidden className="text-2xl">
            +
          </span>
        </Link>
      ) : null}

      {atalhos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {atalhos.map((a) => (
            <Link
              className="rounded-xl border border-slate-200 bg-white p-4 active:bg-slate-50"
              href={a.href}
              key={a.href}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {a.titulo}
                </span>
                {a.destaque ? (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                    {a.destaque}
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                {a.descricao}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Você ainda não tem acesso a áreas do módulo disciplinar. Fale com a
          administração do colégio.
        </p>
      )}
    </AdminPage>
  );
}
