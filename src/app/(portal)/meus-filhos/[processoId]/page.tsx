import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  podeConfirmarCiencia,
  podeManifestar,
} from "@/modules/disciplina/services/manifestacao-rules";
import { dentroDoPrazoReconsideracao } from "@/modules/disciplina/services/reconsideracao-rules";
import { PortalAcoesProcesso } from "@/modules/responsaveis/components/portal-acoes-processo";
import { getProcessoDoFilho } from "@/modules/responsaveis/queries/portal";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

export const dynamic = "force-dynamic";

function data(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(valor);
}
function dataHora(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor);
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className="text-slate-500">{rotulo}</span>
      <span className="text-right text-slate-800">{valor}</span>
    </div>
  );
}

export default async function ProcessoDoFilhoPage({
  params,
}: {
  params: Promise<{ processoId: string }>;
}) {
  const context = await getTenantContext();
  if (context.onboardingPendente) {
    redirect("/primeiro-acesso");
  }
  const { processoId } = await params;

  const p = await getProcessoDoFilho(
    processoId,
    context.usuarioId,
    context.colegioId,
  );
  if (!p) {
    notFound();
  }

  const decisao = p.decisoes[0] ?? null;
  const sancaoVigente =
    p.sancoes.find((s) => s.status !== "ANULADA") ?? null;
  const temReconsideracaoPendente = p.sancoes.some((s) =>
    s.reconsideracoes.some((r) => r.status === "PENDENTE"),
  );

  const podeManif =
    podeManifestar(p.ocorrencia.status, p.status) &&
    p.manifestacoes.length === 0;
  const jaTemCienciaOcorrencia = p.ciencias.some(
    (c) => c.sobre === "OCORRENCIA",
  );
  const podeCiencia =
    !jaTemCienciaOcorrencia &&
    podeConfirmarCiencia(p.ocorrencia.status, false);

  const sancaoRecursoId =
    sancaoVigente &&
    !temReconsideracaoPendente &&
    (sancaoVigente.status === "ATIVA" ||
      sancaoVigente.status === "SUSPENSA" ||
      sancaoVigente.status === "CUMPRIDA") &&
    dentroDoPrazoReconsideracao(sancaoVigente.aplicadaEm, new Date())
      ? sancaoVigente.id
      : null;

  return (
    <div className="space-y-4">
      <Link
        className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
        href="/meus-filhos"
      >
        Voltar
      </Link>

      <div>
        <h1 className="text-lg font-semibold text-slate-950">
          {p.numeroProcesso ?? "Processo"}
        </h1>
        <p className="text-sm text-slate-600">{p.aluno.nome}</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <Linha rotulo="Situação" valor={p.status} />
        <Linha rotulo="Tipo" valor={p.ocorrencia.tipo} />
        <Linha
          rotulo="Data do fato"
          valor={data(p.ocorrencia.dataOcorrencia)}
        />
        <Linha rotulo="Local" valor={p.ocorrencia.local ?? "-"} />
        <div className="pt-2">
          <p className="text-sm text-slate-500">Relato</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
            {p.ocorrencia.descricao}
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Manifestações ({p.manifestacoes.length})
        </h2>
        {p.manifestacoes.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Nenhuma manifestação registrada.
          </p>
        ) : (
          <ul className="space-y-2">
            {p.manifestacoes.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <p className="text-xs text-slate-500">
                  {m.tipo} · {dataHora(m.createdAt)} · {m.autor.nome}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
                  {m.texto}
                </p>
              </li>
            ))}
          </ul>
        )}
        {p.manifestacaoAcolhida !== null ? (
          <p className="mt-2 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
            {p.manifestacaoAcolhida
              ? "Justificativa acolhida — sem sanção."
              : "Justificativa não acolhida."}
            {p.parecerManifestacao ? ` ${p.parecerManifestacao}` : ""}
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Ciência</h2>
        {p.ciencias.length === 0 ? (
          <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Ciência ainda não confirmada.
          </p>
        ) : (
          p.ciencias.map((c) => (
            <p
              key={c.id}
              className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700"
            >
              {c.sobre} · {c.meio} · {dataHora(c.createdAt)}
            </p>
          ))
        )}
      </section>

      {decisao ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Decisão</h2>
          <p className="mt-1 text-sm text-slate-800">
            {decisao.numero ? `${decisao.numero} · ` : ""}
            {decisao.resultado}
            {decisao.naturezaApurada
              ? ` · natureza ${decisao.naturezaApurada}`
              : ""}
          </p>
          {decisao.sancaoTipoCodigo ? (
            <p className="text-sm text-slate-700">
              Sanção: {decisao.sancaoTipoCodigo}
              {decisao.diasSancao ? ` (${decisao.diasSancao} dias)` : ""}
            </p>
          ) : null}
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {decisao.fundamentacao}
          </p>
        </section>
      ) : null}

      {sancaoVigente ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <h2 className="text-sm font-semibold text-slate-900">Sanção</h2>
          <p className="mt-1">
            {sancaoVigente.tipoSancaoCodigo}
            {sancaoVigente.dias ? ` · ${sancaoVigente.dias} dias` : ""} ·{" "}
            {sancaoVigente.status}
          </p>
          <p className="text-xs text-slate-500">
            {sancaoVigente.numeroPublicacao ?? "sem número"} ·{" "}
            {data(sancaoVigente.aplicadaEm)}
          </p>
        </section>
      ) : null}

      <PortalAcoesProcesso
        ocorrenciaAlunoId={p.id}
        podeConfirmarCiencia={podeCiencia}
        podeManifestar={podeManif}
        sancaoRecursoId={sancaoRecursoId}
      />
    </div>
  );
}
