import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ArquivarOcorrenciaForm } from "@/modules/disciplina/components/arquivar-ocorrencia-form";
import { EditarOcorrenciaForm } from "@/modules/disciplina/components/editar-ocorrencia-form";
import {
  EnviarOcorrenciaForm,
  IniciarAveriguacaoForm,
} from "@/modules/disciplina/components/ocorrencia-status-forms";
import { AnaliseProcesso } from "@/modules/disciplina/components/analise-processo";
import {
  AfastamentoAcoes,
  ConselhoAcoes,
  SindicanciaAcoes,
} from "@/modules/disciplina/components/d8-acoes";
import { ProcessoAcoes } from "@/modules/disciplina/components/processo-acoes";
import { AnexosPanel } from "@/modules/disciplina/components/anexos-panel";
import { ReconsideracaoAcoes } from "@/modules/disciplina/components/reconsideracao-acoes";
import { SancaoAcoes } from "@/modules/disciplina/components/sancao-acoes";
import { getOcorrencia } from "@/modules/disciplina/queries/get-ocorrencia";
import { getResumoPontuacao } from "@/modules/disciplina/queries/get-resumo-pontuacao";
import { listAnexosDaOcorrencia } from "@/modules/disciplina/queries/list-anexos";
import { listOpcoesAnalise } from "@/modules/disciplina/queries/list-opcoes-analise";
import { storageConfigurado } from "@/lib/storage/supabase-storage";
import {
  podeArquivarOcorrencia,
  podeEditarOcorrencia,
  podeEnviarOcorrencia,
  podeIniciarAveriguacao,
} from "@/modules/disciplina/services/ocorrencia-rules";
import {
  podeAvaliarManifestacao,
  podeConfirmarCiencia,
  podeManifestar,
} from "@/modules/disciplina/services/manifestacao-rules";
import {
  podeDecidir,
  podeEnquadrar,
} from "@/modules/disciplina/services/decisao-rules";
import {
  dentroDoPrazoReconsideracao,
  podeSolicitarReconsideracao,
} from "@/modules/disciplina/services/reconsideracao-rules";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requireAnyPermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-2 sm:grid-cols-[180px_1fr]">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export default async function OcorrenciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_READ_OWN,
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  ]);
  const { id } = await params;
  const [ocorrencia, opcoesAnalise] = await Promise.all([
    getOcorrencia(id, context.colegioId),
    listOpcoesAnalise(),
  ]);

  if (!ocorrencia) {
    notFound();
  }

  const [resumoPorAluno, anexos] = await Promise.all([
    getResumoPontuacao(
      context.colegioId,
      ocorrencia.alunos.map((processo) => processo.aluno.id),
    ),
    listAnexosDaOcorrencia(ocorrencia.id, context.colegioId),
  ]);
  const permiteAnexos = context.permissoes.includes(PERMISSIONS.ANEXOS_MANAGE);

  const ehComunicante = ocorrencia.comunicanteId === context.usuarioId;
  const podeVerEscola = context.permissoes.includes(
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  );
  if (!podeVerEscola && !ehComunicante) {
    notFound();
  }

  const podeConduzir = context.permissoes.includes(
    PERMISSIONS.OCORRENCIAS_MANAGE,
  );
  const podeGerir = podeConduzir || ehComunicante;

  const mostrarEnviar =
    podeGerir && podeEnviarOcorrencia(ocorrencia.status);
  const mostrarAveriguar =
    podeConduzir && podeIniciarAveriguacao(ocorrencia.status);
  const mostrarEditar =
    podeGerir && podeEditarOcorrencia(ocorrencia.status);
  const mostrarArquivar =
    podeConduzir && podeArquivarOcorrencia(ocorrencia.status);

  const permiteCriarManifestacao = context.permissoes.includes(
    PERMISSIONS.MANIFESTACOES_CREATE,
  );
  const permiteConfirmarCiencia = context.permissoes.includes(
    PERMISSIONS.CIENCIAS_CONFIRM,
  );
  const permiteAvaliarManifestacao = context.permissoes.includes(
    PERMISSIONS.MANIFESTACOES_AVALIAR,
  );
  const permiteEnquadrar = context.permissoes.includes(
    PERMISSIONS.ENQUADRAMENTOS_MANAGE,
  );
  const permiteDecidir = context.permissoes.includes(
    PERMISSIONS.DECISOES_REGISTER,
  );
  const permiteAplicarSancao = context.permissoes.includes(
    PERMISSIONS.SANCOES_APPLY,
  );
  const permiteSolicitarReconsideracao = context.permissoes.includes(
    PERMISSIONS.RECONSIDERACOES_CREATE,
  );
  const permiteDecidirReconsideracao = context.permissoes.includes(
    PERMISSIONS.RECONSIDERACOES_DECIDE,
  );
  const permiteAfastamento = context.permissoes.includes(
    PERMISSIONS.AFASTAMENTOS_MANAGE,
  );
  const permiteSindicancia = context.permissoes.includes(
    PERMISSIONS.SINDICANCIAS_MANAGE,
  );
  const permiteConselho = context.permissoes.includes(
    PERMISSIONS.CONSELHOS_MANAGE,
  );

  type Processo = (typeof ocorrencia.alunos)[number];
  const processoColumns: Column<Processo>[] = [
    { header: "#", render: (row) => row.ordem },
    {
      header: "Processo",
      render: (row) => row.numeroProcesso ?? "(pendente de envio)",
    },
    { header: "Aluno", render: (row) => row.aluno.nome },
    {
      header: "Matrícula geral",
      render: (row) => row.aluno.matriculaGeral ?? "-",
    },
    { header: "Situação", render: (row) => row.status },
  ];

  return (
    <AdminPage
      description="Detalhe da ocorrência e dos processos individuais. Nenhuma sanção é aplicada nesta etapa."
      eyebrow="Disciplina"
      title={ocorrencia.numero ?? "Comunicação (rascunho)"}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/disciplina/ocorrencias"
        >
          Voltar
        </Link>
      </div>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <dl>
          <InfoRow label="Status" value={ocorrencia.status} />
          <InfoRow label="Tipo" value={ocorrencia.tipo} />
          <InfoRow
            label="Data do fato"
            value={formatarData(ocorrencia.dataOcorrencia)}
          />
          <InfoRow label="Local" value={ocorrencia.local ?? "-"} />
          <InfoRow label="Comunicante" value={ocorrencia.comunicante.nome} />
          <InfoRow
            label="Sigilosa"
            value={ocorrencia.sigiloso ? "Sim" : "Não"}
          />
          {ocorrencia.enviadaEm ? (
            <InfoRow
              label="Enviada em"
              value={formatarData(ocorrencia.enviadaEm)}
            />
          ) : null}
          {ocorrencia.motivoArquivamento ? (
            <InfoRow
              label="Motivo do arquivamento"
              value={ocorrencia.motivoArquivamento}
            />
          ) : null}
          {ocorrencia.motivoSugerido ? (
            <InfoRow
              label="Motivo sugerido"
              value={`${ocorrencia.motivoSugerido.codigo} — ${ocorrencia.motivoSugerido.descricao} (sugerido pelo comunicante; a autoridade confirma no enquadramento)`}
            />
          ) : null}
          <InfoRow
            label="Descrição"
            value={
              <span className="whitespace-pre-wrap">{ocorrencia.descricao}</span>
            }
          />
        </dl>
      </section>

      <div className="mb-6">
        <h2 className="mb-1 text-base font-semibold text-slate-950">
          Processos individuais ({ocorrencia.alunos.length})
        </h2>
        <p className="mb-2 text-xs text-slate-500">
          Ao enviar, cada aluno recebe um número oficial próprio — a defesa de
          cada um corre de forma independente.
        </p>
        <DataTable
          columns={processoColumns}
          emptyMessage="Nenhum aluno vinculado."
          getRowId={(row) => row.id}
          mobileHideColumns={["#", "Aluno"]}
          mobileTitle={(row) => `${row.ordem}. ${row.aluno.nome}`}
          rows={ocorrencia.alunos}
        />
      </div>

      <section className="mb-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-950">
          Comunicações, manifestações e ciência
        </h2>
        {ocorrencia.alunos.map((processo) => {
          const podeRegistrarManifestacao =
            permiteCriarManifestacao &&
            podeManifestar(ocorrencia.status, processo.status);
          const podeRegistrarCiencia =
            permiteConfirmarCiencia &&
            podeConfirmarCiencia(
              ocorrencia.status,
              processo.ciencias.length > 0,
            );
          const podeAvaliar =
            permiteAvaliarManifestacao &&
            podeAvaliarManifestacao(
              processo.status,
              processo.manifestacoes.length,
            );

          return (
            <article
              key={processo.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {processo.ordem}. {processo.aluno.nome}
                  </p>
                  <p className="text-xs text-slate-500">
                    {processo.numeroProcesso ?? "(processo pendente de envio)"} ·{" "}
                    Situação: {processo.status}
                  </p>
                </div>
                {(() => {
                  const resumo = resumoPorAluno.get(processo.aluno.id);
                  if (!resumo) {
                    return null;
                  }
                  return (
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        resumo.exigeAcompanhamento
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                      title={`${resumo.totalMovimentos} movimento(s) no histórico`}
                    >
                      Saldo {resumo.saldoBruto.toFixed(2)}
                      {resumo.exigeAcompanhamento ? " · acompanhar" : ""}
                    </span>
                  );
                })()}
              </header>

              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Manifestações ({processo.manifestacoes.length})
                </p>
                {processo.manifestacoes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma manifestação registrada.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {processo.manifestacoes.map((m) => (
                      <li
                        key={m.id}
                        className="rounded-md border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="text-xs text-slate-500">
                          {m.tipo} · {formatarData(m.createdAt)} · por{" "}
                          {m.autor.nome}
                          {m.viaPresencial
                            ? ` (registrada por ${m.registradoPor.nome})`
                            : ""}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                          {m.texto}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Ciência
                </p>
                {processo.ciencias.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Ciência ainda não confirmada.
                  </p>
                ) : (
                  processo.ciencias.map((c) => (
                    <p key={c.id} className="text-sm text-slate-800">
                      {c.sobre} · {c.meio} · {formatarData(c.createdAt)} · por{" "}
                      {c.confirmadaPor.nome}
                      {c.observacao ? ` — ${c.observacao}` : ""}
                    </p>
                  ))
                )}
              </div>

              {processo.avaliadoEm ? (
                <div className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Avaliação da manifestação
                  </p>
                  <p className="text-sm text-slate-800">
                    {processo.manifestacaoAcolhida
                      ? "Acolhida — processo justificado, sem sanção."
                      : "Indeferida — segue para análise."}{" "}
                    ({formatarData(processo.avaliadoEm)}
                    {processo.avaliadoPor
                      ? ` · ${processo.avaliadoPor.nome}`
                      : ""}
                    )
                  </p>
                  {processo.parecerManifestacao ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                      {processo.parecerManifestacao}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <ProcessoAcoes
                ocorrenciaAlunoId={processo.id}
                podeAvaliar={podeAvaliar}
                podeConfirmarCiencia={podeRegistrarCiencia}
                podeManifestar={podeRegistrarManifestacao}
              />

              <AnaliseProcesso
                decisao={processo.decisoes[0] ?? null}
                enquadramentos={processo.enquadramentos}
                motivoSugerido={ocorrencia.motivoSugerido}
                ocorrenciaAlunoId={processo.id}
                opcoes={opcoesAnalise}
                podeDecidir={
                  permiteDecidir &&
                  podeDecidir(ocorrencia.status, processo.status)
                }
                podeEnquadrar={
                  permiteEnquadrar &&
                  podeEnquadrar(ocorrencia.status, processo.status)
                }
              />

              {(() => {
                const decisao = processo.decisoes[0] ?? null;
                const sancaoAtiva =
                  processo.sancoes.find((s) => s.status !== "ANULADA") ?? null;
                const sancaoParaExibir = sancaoAtiva ?? processo.sancoes[0] ?? null;
                const decisaoProcedente =
                  decisao?.resultado === "PROCEDENTE";
                if (!decisaoProcedente && !sancaoParaExibir) {
                  return null;
                }
                return (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Sanção
                    </p>
                    {processo.sancoes.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        Decisão procedente — sanção ainda não aplicada.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {processo.sancoes.map((s) => (
                          <li
                            key={s.id}
                            className="rounded-md border border-slate-100 bg-slate-50 p-3"
                          >
                            <p className="text-sm font-semibold text-slate-800">
                              {s.tipoSancaoCodigo}
                              {s.dias ? ` · ${s.dias} dias` : ""} · {s.status}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.numeroPublicacao ?? "sem número"} ·{" "}
                              {formatarData(s.aplicadaEm)} · por{" "}
                              {s.aplicadaPor.nome} · impacto{" "}
                              {Number(s.impactoPontos).toFixed(2)}
                            </p>
                            {s.observacao ? (
                              <p className="mt-1 text-sm text-slate-700">
                                {s.observacao}
                              </p>
                            ) : null}
                            {s.modificacoes.length > 0 ? (
                              <ul className="mt-1 space-y-0.5">
                                {s.modificacoes.map((m) => (
                                  <li
                                    key={m.id}
                                    className="text-xs text-slate-500"
                                  >
                                    {m.tipo} · {formatarData(m.createdAt)} ·{" "}
                                    {m.registradoPor.nome} — {m.motivo}
                                  </li>
                                ))}
                              </ul>
                            ) : null}

                            {s.reconsideracoes.length > 0 ? (
                              <div className="mt-2 space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Reconsiderações
                                </p>
                                {s.reconsideracoes.map((r) => (
                                  <div
                                    key={r.id}
                                    className="rounded border border-slate-200 bg-white p-2"
                                  >
                                    <p className="text-xs text-slate-600">
                                      {r.status} ·{" "}
                                      {r.numero ?? "sem despacho"} · solicitada{" "}
                                      {formatarData(r.createdAt)} por{" "}
                                      {r.solicitante.nome} · prazo{" "}
                                      {formatarData(r.prazoFinal)}
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                      {r.texto}
                                    </p>
                                    {r.parecerDecisao ? (
                                      <p className="mt-1 text-sm text-slate-700">
                                        <span className="font-semibold">
                                          Despacho
                                        </span>{" "}
                                        ({r.decididoPor?.nome} ·{" "}
                                        {r.decididoPorPerfilCodigo}):{" "}
                                        {r.parecerDecisao}
                                        {r.novoTipoSancaoCodigo
                                          ? ` — nova sanção ${r.novoTipoSancaoCodigo}${
                                              r.novosDias
                                                ? ` (${r.novosDias} dias)`
                                                : ""
                                            }`
                                          : ""}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}

                            {(() => {
                              const pendente =
                                s.reconsideracoes.find(
                                  (r) => r.status === "PENDENTE",
                                ) ?? null;
                              const dentroPrazo = dentroDoPrazoReconsideracao(
                                s.aplicadaEm,
                                new Date(),
                              );
                              const podeSolicitar =
                                permiteSolicitarReconsideracao &&
                                !pendente &&
                                dentroPrazo &&
                                podeSolicitarReconsideracao(
                                  s.status,
                                  false,
                                );
                              return (
                                <ReconsideracaoAcoes
                                  podeDecidir={permiteDecidirReconsideracao}
                                  podeSolicitar={podeSolicitar}
                                  reconsideracaoPendenteId={pendente?.id ?? null}
                                  sancaoId={s.id}
                                  tiposSancao={opcoesAnalise.tiposSancao}
                                />
                              );
                            })()}
                          </li>
                        ))}
                      </ul>
                    )}
                    <SancaoAcoes
                      alunoNecessidadeEspecial={processo.aluno.necessidadeEspecial}
                      decisaoId={decisao?.id ?? null}
                      ocorrenciaAlunoId={processo.id}
                      podeAplicar={permiteAplicarSancao}
                      sancaoId={sancaoParaExibir?.id ?? null}
                      sancaoStatus={sancaoParaExibir?.status ?? null}
                    />
                  </div>
                );
              })()}

              {(() => {
                const docBase = `/disciplina/ocorrencias/${ocorrencia.id}/documento`;
                const links: React.ReactNode[] = [];
                // Um numero, um aluno: o link e sempre do processo individual,
                // nunca da ocorrencia inteira (mesmo em comunicacao coletiva).
                if (processo.numeroProcesso) {
                  links.push(
                    <DocLink
                      key="com"
                      href={`${docBase}?tipo=COMUNICACAO&processoId=${processo.id}`}
                    >
                      Comunicação (PDF)
                    </DocLink>,
                  );
                }
                if (processo.ciencias.some((c) => c.sobre === "OCORRENCIA")) {
                  links.push(
                    <DocLink
                      key="tc-o"
                      href={`${docBase}?tipo=TERMO_CIENCIA&processoId=${processo.id}&alvo=OCORRENCIA`}
                    >
                      Termo de ciência (PDF)
                    </DocLink>,
                  );
                }
                if (processo.ciencias.some((c) => c.sobre === "DECISAO")) {
                  links.push(
                    <DocLink
                      key="tc-d"
                      href={`${docBase}?tipo=TERMO_CIENCIA&processoId=${processo.id}&alvo=DECISAO`}
                    >
                      Ciência da decisão (PDF)
                    </DocLink>,
                  );
                }
                if (processo.decisoes.length > 0) {
                  links.push(
                    <DocLink
                      key="dec"
                      href={`${docBase}?tipo=DECISAO&processoId=${processo.id}`}
                    >
                      Decisão (PDF)
                    </DocLink>,
                  );
                }
                for (const s of processo.sancoes) {
                  for (const r of s.reconsideracoes) {
                    if (r.parecerDecisao) {
                      links.push(
                        <DocLink
                          key={`desp-${r.id}`}
                          href={`${docBase}?tipo=DESPACHO_RECONSIDERACAO&reconsideracaoId=${r.id}`}
                        >
                          Despacho {r.numero ?? ""} (PDF)
                        </DocLink>,
                      );
                    }
                  }
                }
                for (const a of processo.afastamentos) {
                  links.push(
                    <DocLink
                      key={`port-${a.id}`}
                      href={`${docBase}?tipo=PORTARIA_AFASTAMENTO&afastamentoId=${a.id}`}
                    >
                      Portaria afastamento (PDF)
                    </DocLink>,
                  );
                }
                for (const c of processo.conselhos) {
                  if (c.parecer) {
                    links.push(
                      <DocLink
                        key={`par-${c.id}`}
                        href={`${docBase}?tipo=PARECER_CONSELHO&conselhoId=${c.id}`}
                      >
                        Parecer conselho (PDF)
                      </DocLink>,
                    );
                  }
                }
                if (links.length === 0) {
                  return null;
                }
                return (
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    {links}
                  </div>
                );
              })()}
            </article>
          );
        })}
      </section>

      {permiteAfastamento || permiteSindicancia || permiteConselho ||
      ocorrencia.sindicancias.length > 0 ||
      ocorrencia.alunos.some(
        (p) => p.afastamentos.length > 0 || p.conselhos.length > 0,
      ) ? (
        <section className="mb-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-950">
            Afastamento cautelar, sindicância e conselho
          </h2>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Sindicâncias ({ocorrencia.sindicancias.length})
            </p>
            {ocorrencia.sindicancias.map((s) => (
              <div
                key={s.id}
                className="mt-2 rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-800">
                  {s.numero ?? "sem número"} · {s.status}
                </p>
                <p className="text-xs text-slate-500">
                  {formatarData(s.createdAt)} · sindicante {s.sindicante.nome}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {s.objeto}
                </p>
                {s.conclusao ? (
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="font-semibold">Conclusão:</span>{" "}
                    {s.conclusao}
                  </p>
                ) : null}
              </div>
            ))}
            <div className="mt-3">
              <SindicanciaAcoes
                ocorrenciaId={ocorrencia.id}
                podeGerir={permiteSindicancia}
                sindicanciasAtivas={ocorrencia.sindicancias}
              />
            </div>
          </div>

          {ocorrencia.alunos.map((processo) => {
            const afastamentoAtivo =
              processo.afastamentos.find(
                (a) => a.status === "ATIVO" || a.status === "PRORROGADO",
              ) ?? null;
            const conselhoAberto =
              processo.conselhos.find((c) => c.status !== "CONCLUIDO") ?? null;
            const mostrar =
              permiteAfastamento ||
              permiteConselho ||
              processo.afastamentos.length > 0 ||
              processo.conselhos.length > 0;
            if (!mostrar) {
              return null;
            }
            return (
              <div
                key={processo.id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {processo.ordem}. {processo.aluno.nome}
                </p>

                {processo.afastamentos.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Afastamentos cautelares
                    </p>
                    {processo.afastamentos.map((a) => (
                      <div
                        key={a.id}
                        className="rounded-md border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="text-sm text-slate-800">
                          {a.status} · {a.diasIniciais} dias · início{" "}
                          {formatarData(a.inicioEm)} · fim{" "}
                          {formatarData(a.fimProrrogado ?? a.fimPrevisto)}
                        </p>
                        <p className="text-xs text-slate-500">
                          determinado por {a.determinadoPor.nome}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {a.justificativa}
                        </p>
                        {a.motivoEncerramento ? (
                          <p className="text-xs text-slate-500">
                            Encerramento: {a.motivoEncerramento}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2">
                  <AfastamentoAcoes
                    afastamentoAtivoId={afastamentoAtivo?.id ?? null}
                    afastamentoAtivoStatus={afastamentoAtivo?.status ?? null}
                    ocorrenciaAlunoId={processo.id}
                    podeGerir={permiteAfastamento}
                  />
                </div>

                {processo.conselhos.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Conselho disciplinar
                    </p>
                    {processo.conselhos.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-md border border-slate-100 bg-slate-50 p-3"
                      >
                        <p className="text-sm font-semibold text-slate-800">
                          {c.numero ?? "sem número"} · {c.status}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                          {c.objeto}
                        </p>
                        {c.parecer ? (
                          <p className="mt-1 text-sm text-slate-700">
                            <span className="font-semibold">Parecer:</span>{" "}
                            {c.parecer} — recomendação: {c.recomendacao} (
                            {c.votosFavor ?? 0} x {c.votosContra ?? 0})
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2">
                  <ConselhoAcoes
                    conselhoAbertoId={conselhoAberto?.id ?? null}
                    ocorrenciaAlunoId={processo.id}
                    podeGerir={permiteConselho}
                  />
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      {permiteAnexos || anexos.length > 0 ? (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-2 text-base font-semibold text-slate-950">
            Anexos ({anexos.length})
          </h2>
          <AnexosPanel
            anexos={anexos}
            ocorrenciaId={ocorrencia.id}
            podeGerir={permiteAnexos}
            processos={ocorrencia.alunos.map((p) => ({
              id: p.id,
              label: `${p.ordem}. ${p.aluno.nome}`,
            }))}
            storageConfigurado={storageConfigurado()}
          />
        </section>
      ) : null}

      {mostrarEnviar || mostrarAveriguar || mostrarEditar || mostrarArquivar ? (
        <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-semibold text-slate-950">Ações</h2>
          {mostrarEnviar ? <EnviarOcorrenciaForm id={ocorrencia.id} /> : null}
          {mostrarAveriguar ? (
            <IniciarAveriguacaoForm id={ocorrencia.id} />
          ) : null}
          {mostrarEditar ? (
            <EditarOcorrenciaForm
              dataOcorrencia={ocorrencia.dataOcorrencia
                .toISOString()
                .slice(0, 16)}
              descricao={ocorrencia.descricao}
              id={ocorrencia.id}
              local={ocorrencia.local}
              materia={ocorrencia.materia}
              sigiloso={ocorrencia.sigiloso}
              tipo={ocorrencia.tipo}
            />
          ) : null}
          {mostrarArquivar ? (
            <ArquivarOcorrenciaForm id={ocorrencia.id} />
          ) : null}
        </section>
      ) : null}
    </AdminPage>
  );
}
