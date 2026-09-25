import Link from "next/link";
import { redirect } from "next/navigation";

import { listNotificacoesResponsavel } from "@/modules/notificacoes/queries/list-notificacoes-responsavel";
import { marcarNotificacoesComoLidas } from "@/modules/notificacoes/services/marcar-notificacoes-lidas";
import { listFilhosComProcessos } from "@/modules/responsaveis/queries/portal";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(valor);
}

function formatarDataHora(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

const SITUACAO_LABEL: Record<string, string> = {
  PENDENTE: "Aguardando análise",
  JUSTIFICADO: "Justificado",
  PROCEDENTE: "Procedente",
  IMPROCEDENTE: "Improcedente",
  ARQUIVADO: "Arquivado",
};

export default async function MeusFilhosPage() {
  const context = await getTenantContext();
  if (context.onboardingPendente) {
    redirect("/primeiro-acesso");
  }

  const [filhos, notificacoes] = await Promise.all([
    listFilhosComProcessos(context.usuarioId, context.colegioId),
    listNotificacoesResponsavel(context.usuarioId),
  ]);

  // Marca tudo como lido ao abrir esta tela (decisao: lote unico, nao por
  // notificacao individual). Roda depois de buscar a lista acima, pra ainda
  // mostrar o destaque de "nao lida" nesta mesma renderizacao.
  await marcarNotificacoesComoLidas(context.usuarioId, context.colegioId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-950">Meus filhos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Acompanhe as comunicações disciplinares e registre manifestações e
          ciência.
        </p>
      </div>

      {notificacoes.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">Avisos</h2>
          <ul className="space-y-2">
            {notificacoes.map((n) => {
              const naoLida = n.lidoEm === null;
              const conteudo = (
                <div
                  className={`rounded-lg border p-3 ${
                    naoLida
                      ? "border-amber-300 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      {n.titulo}
                    </p>
                    {naoLida ? (
                      <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Novo
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{n.mensagem}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatarDataHora(n.criadoEm)}
                  </p>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.ocorrenciaAlunoId ? (
                    <Link href={`/meus-filhos/${n.ocorrenciaAlunoId}`}>
                      {conteudo}
                    </Link>
                  ) : (
                    conteudo
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {filhos.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
          Nenhum aluno vinculado ao seu acesso. Fale com a secretaria do colégio.
        </p>
      ) : (
        filhos.map(({ aluno, parentesco }) => (
          <section key={aluno.id} className="space-y-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {aluno.nome}
              </h2>
              <p className="text-xs text-slate-500">
                {aluno.matriculaGeral ? `Matrícula ${aluno.matriculaGeral}` : ""}
                {parentesco ? ` · ${parentesco}` : ""}
              </p>
            </div>

            {aluno.ocorrencias.length === 0 ? (
              <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
                Sem comunicações disciplinares.
              </p>
            ) : (
              <ul className="space-y-2">
                {aluno.ocorrencias.map((p) => {
                  const pendenteManifestar =
                    p.status === "PENDENTE" &&
                    p._count.manifestacoes === 0 &&
                    [
                      "ENVIADA",
                      "EM_AVERIGUACAO",
                      "AGUARDANDO_MANIFESTACAO",
                      "AGUARDANDO_CIENCIA",
                    ].includes(p.ocorrencia.status);
                  const pendenteCiencia = p._count.ciencias === 0;
                  return (
                    <li key={p.id}>
                      <Link
                        className="block rounded-lg border border-slate-200 bg-white p-4 active:bg-slate-50"
                        href={`/meus-filhos/${p.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {p.numeroProcesso ?? "Processo"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {SITUACAO_LABEL[p.status] ?? p.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {p.ocorrencia.tipo} ·{" "}
                          {formatarData(p.ocorrencia.dataOcorrencia)}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                          {p.ocorrencia.descricao}
                        </p>
                        {pendenteManifestar || pendenteCiencia ? (
                          <p className="mt-2 text-xs font-semibold text-red-700">
                            {pendenteManifestar
                              ? "Pode apresentar manifestação"
                              : ""}
                            {pendenteManifestar && pendenteCiencia ? " · " : ""}
                            {pendenteCiencia ? "Confirmar ciência" : ""}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}
