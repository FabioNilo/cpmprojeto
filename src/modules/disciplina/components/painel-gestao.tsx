import Link from "next/link";

import { DataTable, type Column } from "@/components/ui/data-table";

import { STATUS_OCORRENCIA } from "../constants";
import type { getPainelGestao } from "../queries/get-painel-gestao";
import {
  DIAS_LIMITE_ATENCAO,
  DIAS_LIMITE_NORMAL,
  ROTULO_PENDENCIA,
  ROTULO_SITUACAO,
  ROTULO_STATUS_OCORRENCIA,
  type Pendencia,
  type Periodo,
  type PresetPeriodo,
  type SituacaoPendencia,
} from "../services/painel-gestao-rules";

const LIMITE_LISTA = 15;

const SITUACOES_VALIDAS: readonly SituacaoPendencia[] = [
  "NORMAL",
  "ATENCAO",
  "ATRASO",
];

const ESTILO_SITUACAO: Record<SituacaoPendencia, string> = {
  NORMAL: "bg-slate-100 text-slate-700",
  ATENCAO: "bg-amber-100 text-amber-900",
  ATRASO: "bg-red-100 text-red-800",
};

const numero = new Intl.NumberFormat("pt-BR");
const pontos = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Bahia",
});

type DadosPainel = Awaited<ReturnType<typeof getPainelGestao>>;

type FiltroLista = {
  situacao?: string;
  pendencias?: string;
};

function hrefPainel(
  periodo: Periodo,
  extras: Record<string, string | undefined> = {},
  ancora = "",
): string {
  const params = new URLSearchParams();
  if (periodo.preset !== "ano") {
    params.set("periodo", periodo.preset);
  }
  if (periodo.preset === "livre") {
    params.set("de", periodo.de);
    params.set("ate", periodo.ate);
  }
  for (const [chave, valor] of Object.entries(extras)) {
    if (valor) {
      params.set(chave, valor);
    }
  }
  const query = params.toString();
  return `/dashboard${query ? `?${query}` : ""}${ancora}`;
}

function CartaoNumero({
  rotulo,
  valor,
  detalhe,
  href,
  destaque,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  href: string;
  destaque?: "ATENCAO" | "ATRASO";
}) {
  const borda =
    destaque === "ATRASO"
      ? "border-red-300"
      : destaque === "ATENCAO"
        ? "border-amber-300"
        : "border-slate-200";
  return (
    <Link
      className={`block rounded-xl border bg-white p-4 hover:bg-slate-50 ${borda}`}
      href={href}
    >
      <span className="block text-xs font-medium text-slate-500">{rotulo}</span>
      <span className="mt-1 block text-3xl font-semibold text-slate-950">
        {valor}
      </span>
      <span className="mt-1 block text-xs text-slate-500">{detalhe}</span>
    </Link>
  );
}

function FiltroPeriodo({ periodo }: { periodo: Periodo }) {
  const opcoes: { preset: PresetPeriodo; rotulo: string; href: string }[] = [
    { preset: "ano", rotulo: "Ano letivo", href: "/dashboard" },
    { preset: "mes", rotulo: "Este mês", href: "/dashboard?periodo=mes" },
    { preset: "30d", rotulo: "Últimos 30 dias", href: "/dashboard?periodo=30d" },
  ];
  return (
    <div className="mb-5 flex flex-wrap items-end gap-x-4 gap-y-3">
      <nav aria-label="Período" className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => (
          <Link
            aria-current={periodo.preset === opcao.preset ? "true" : undefined}
            className={`inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium ${
              periodo.preset === opcao.preset
                ? "border-navy-900 bg-navy-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            href={opcao.href}
            key={opcao.preset}
          >
            {opcao.rotulo}
          </Link>
        ))}
      </nav>
      <form action="/dashboard" className="flex flex-wrap items-end gap-2">
        <input name="periodo" type="hidden" value="livre" />
        <label className="text-xs font-medium text-slate-600">
          De
          <input
            className="mt-1 block h-10 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
            defaultValue={periodo.de}
            name="de"
            required
            type="date"
          />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Até
          <input
            className="mt-1 block h-10 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
            defaultValue={periodo.ate}
            name="ate"
            required
            type="date"
          />
        </label>
        <button
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          type="submit"
        >
          Aplicar
        </button>
      </form>
    </div>
  );
}

function ListaPendencias({
  pendencias,
  periodo,
  filtro,
}: {
  pendencias: Pendencia[];
  periodo: Periodo;
  filtro: FiltroLista;
}) {
  const situacao = SITUACOES_VALIDAS.find((s) => s === filtro.situacao);
  const filtradas = situacao
    ? pendencias.filter((p) => p.situacao === situacao)
    : pendencias;
  const verTodas = filtro.pendencias === "todas";
  const visiveis = verTodas ? filtradas : filtradas.slice(0, LIMITE_LISTA);

  const colunas: Column<Pendencia>[] = [
    { header: "Número", render: (p) => p.numero ?? "-" },
    { header: "Aluno", render: (p) => p.alunoNome },
    { header: "Pendência", render: (p) => ROTULO_PENDENCIA[p.tipo] },
    {
      header: "Há",
      render: (p) => `${p.dias} ${p.dias === 1 ? "dia" : "dias"}`,
    },
    {
      header: "Situação",
      render: (p) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_SITUACAO[p.situacao]}`}
        >
          {ROTULO_SITUACAO[p.situacao]}
        </span>
      ),
    },
    {
      header: "Detalhe",
      render: (p) => (
        <Link
          className="font-semibold text-navy-800 hover:underline"
          href={`/disciplina/ocorrencias/${p.ocorrenciaId}`}
        >
          Abrir
        </Link>
      ),
    },
  ];

  return (
    <section className="mb-6 scroll-mt-4" id="pendencias">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-950">
            Comunicações sem solução
            {situacao ? ` · ${ROTULO_SITUACAO[situacao]}` : ""}
          </h2>
          <p className="text-xs text-slate-500">
            Sem decisão, com sanção não cumprida ou com reconsideração pendente.
            Mais antigas primeiro, em qualquer período.
          </p>
        </div>
        {situacao ? (
          <Link
            className="text-sm font-medium text-navy-800 hover:underline"
            href={hrefPainel(periodo, {}, "#pendencias")}
          >
            Ver todas as situações
          </Link>
        ) : null}
      </div>
      <DataTable
        columns={colunas}
        emptyMessage={
          situacao
            ? "Nenhuma pendência nesta situação."
            : "Nenhuma comunicação sem solução."
        }
        getRowId={(p) => p.id}
        mobileHideColumns={["Número", "Detalhe"]}
        mobileHref={(p) => `/disciplina/ocorrencias/${p.ocorrenciaId}`}
        mobileTitle={(p) => p.numero ?? "-"}
        rows={visiveis}
      />
      {filtradas.length > LIMITE_LISTA ? (
        <p className="mt-2 text-sm text-slate-600">
          {verTodas
            ? `Mostrando todas as ${numero.format(filtradas.length)}. `
            : `Mostrando as ${LIMITE_LISTA} mais antigas de ${numero.format(filtradas.length)}. `}
          <Link
            className="font-medium text-navy-800 hover:underline"
            href={hrefPainel(
              periodo,
              { situacao, pendencias: verTodas ? undefined : "todas" },
              "#pendencias",
            )}
          >
            {verTodas ? "Mostrar menos" : "Ver todas"}
          </Link>
        </p>
      ) : null}
    </section>
  );
}

function StatusComunicacoes({
  status,
  periodo,
}: {
  status: DadosPainel["status"];
  periodo: Periodo;
}) {
  const totalPorStatus = new Map(status.map((s) => [s.status, s.total]));
  const linhas = STATUS_OCORRENCIA.filter((s) => totalPorStatus.has(s)).map(
    (s) => ({ status: s, total: totalPorStatus.get(s) ?? 0 }),
  );
  const total = linhas.reduce((soma, linha) => soma + linha.total, 0);
  const maior = Math.max(1, ...linhas.map((linha) => linha.total));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-950">
        Status das comunicações
      </h2>
      <p className="mb-4 text-xs text-slate-500">
        {numero.format(total)} no período, pela data do fato. Não inclui
        rascunhos.
      </p>
      {linhas.length === 0 ? (
        <p className="text-sm text-slate-600">Nenhuma comunicação no período.</p>
      ) : (
        <ul className="space-y-1">
          {linhas.map((linha) => {
            const rotulo = ROTULO_STATUS_OCORRENCIA[linha.status];
            const percentual = Math.round((linha.total / total) * 100);
            const params = new URLSearchParams({
              status: linha.status,
              de: periodo.de,
              ate: periodo.ate,
            });
            return (
              <li key={linha.status}>
                <Link
                  className="block rounded-md px-2 py-1.5 hover:bg-slate-50"
                  href={`/disciplina/ocorrencias?${params.toString()}`}
                  title={`${rotulo}: ${numero.format(linha.total)} (${percentual}%)`}
                >
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-slate-700">{rotulo}</span>
                    <span className="font-semibold tabular-nums text-slate-950">
                      {numero.format(linha.total)}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="mt-1 block h-1.5 rounded-sm bg-slate-100"
                  >
                    <span
                      className="block h-full min-w-[2px] rounded-sm bg-navy-800"
                      style={{ width: `${(linha.total / maior) * 100}%` }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ResumoElogios({ elogios }: { elogios: DadosPainel["elogios"] }) {
  return (
    <section
      className="scroll-mt-4 rounded-xl border border-slate-200 bg-white p-4"
      id="elogios"
    >
      <h2 className="text-base font-semibold text-slate-950">Elogios</h2>
      <p className="mb-4 text-xs text-slate-500">
        {numero.format(elogios.total)} no período, somando{" "}
        {pontos.format(elogios.pontos)} pontos.
      </p>
      {elogios.ultimos.length === 0 ? (
        <p className="text-sm text-slate-600">Nenhum elogio no período.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {elogios.ultimos.map((elogio) => (
            <li className="py-2" key={elogio.id}>
              <Link
                className="flex items-baseline justify-between gap-3 hover:underline"
                href={`/disciplina/comportamento/${elogio.alunoId}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {elogio.alunoNome}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {elogio.tipo} · {dataCurta.format(elogio.concedidoEm)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  +{pontos.format(elogio.pontos)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PainelGestao({
  dados,
  periodo,
  filtro,
}: {
  dados: DadosPainel;
  periodo: Periodo;
  filtro: FiltroLista;
}) {
  return (
    <>
      <FiltroPeriodo periodo={periodo} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoNumero
          detalhe="Em qualquer período"
          href={hrefPainel(periodo, {}, "#pendencias")}
          rotulo="Sem solução"
          valor={numero.format(dados.pendencias.length)}
        />
        <CartaoNumero
          destaque={dados.situacoes.ATENCAO > 0 ? "ATENCAO" : undefined}
          detalhe={`De ${DIAS_LIMITE_NORMAL + 1} a ${DIAS_LIMITE_ATENCAO} dias parados`}
          href={hrefPainel(periodo, { situacao: "ATENCAO" }, "#pendencias")}
          rotulo="Em atenção"
          valor={numero.format(dados.situacoes.ATENCAO)}
        />
        <CartaoNumero
          destaque={dados.situacoes.ATRASO > 0 ? "ATRASO" : undefined}
          detalhe={`Mais de ${DIAS_LIMITE_ATENCAO} dias parados`}
          href={hrefPainel(periodo, { situacao: "ATRASO" }, "#pendencias")}
          rotulo="Em atraso"
          valor={numero.format(dados.situacoes.ATRASO)}
        />
        <CartaoNumero
          detalhe={periodo.rotulo}
          href="#elogios"
          rotulo="Elogios"
          valor={numero.format(dados.elogios.total)}
        />
      </div>
      <ListaPendencias
        filtro={filtro}
        pendencias={dados.pendencias}
        periodo={periodo}
      />
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <StatusComunicacoes periodo={periodo} status={dados.status} />
        <ResumoElogios elogios={dados.elogios} />
      </div>
    </>
  );
}
