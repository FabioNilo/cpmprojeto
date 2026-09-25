import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  RegistrarAjusteForm,
  RegistrarElogioForm,
} from "@/modules/disciplina/components/comportamento-forms";
import { GerarFichaForm } from "@/modules/disciplina/components/ficha-form";
import { VerConteudoFicha } from "@/modules/disciplina/components/ver-conteudo-ficha";
import { getExtratoAluno } from "@/modules/disciplina/queries/get-extrato-aluno";
import { getFichaAtual } from "@/modules/disciplina/queries/get-ficha";
import { listTiposElogio } from "@/modules/disciplina/queries/list-tipos-elogio";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

function formatarData(valor: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(valor);
}

export default async function ExtratoAlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ alunoId: string }>;
  searchParams: Promise<{ pagina?: string }>;
}) {
  const context = await requirePermission(PERMISSIONS.COMPORTAMENTO_READ);
  const { alunoId } = await params;
  const { pagina } = await searchParams;
  const paginaPedida = Number(pagina) || 1;

  const [extrato, tiposElogio, ficha] = await Promise.all([
    getExtratoAluno(alunoId, context.colegioId, paginaPedida),
    listTiposElogio(),
    getFichaAtual(alunoId, context.colegioId),
  ]);
  if (!extrato) {
    notFound();
  }

  const podeElogiar = context.permissoes.includes(
    PERMISSIONS.ELOGIOS_REGISTER,
  );
  const podeAjustar = context.permissoes.includes(PERMISSIONS.PONTUACAO_MANAGE);
  const podeGerarFicha = context.permissoes.includes(
    PERMISSIONS.FICHAS_GENERATE,
  );

  type Linha = (typeof extrato.linhas)[number];
  const columns: Column<Linha>[] = [
    { header: "Data", render: (row) => formatarData(row.efetivadoEm) },
    { header: "Tipo", render: (row) => row.tipo },
    {
      header: "Valor",
      render: (row) => (row.valor > 0 ? `+${row.valor.toFixed(2)}` : row.valor.toFixed(2)),
    },
    { header: "Saldo após", render: (row) => row.saldoApos.toFixed(2) },
    { header: "Descrição", render: (row) => row.descricao },
    { header: "Registrado por", render: (row) => row.registradoPor },
    {
      header: "Documento",
      render: (row) =>
        row.origemTipo === "elogio" ? (
          <a
            className="text-xs font-semibold text-navy-900 underline hover:no-underline"
            href={`/disciplina/comportamento/${extrato.aluno.id}/elogio/${row.origemId}`}
            rel="noreferrer"
            target="_blank"
          >
            Elogio (PDF)
          </a>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <AdminPage
      description="Extrato completo do comportamento, reconstruído do histórico imutável de movimentos."
      eyebrow="Disciplina"
      title={extrato.aluno.nome}
    >
      <Link
        className="mb-4 inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        href="/disciplina/comportamento"
      >
        Voltar
      </Link>

      <section className="mb-6 flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-medium text-slate-500">Saldo atual</p>
          <p className="text-2xl font-semibold text-slate-900">
            {extrato.resumo.saldoBruto.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Faixa</p>
          <p className="text-lg font-semibold text-slate-800">
            {extrato.faixa?.nome ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Acompanhamento</p>
          <p className="text-lg font-semibold text-slate-800">
            {extrato.resumo.exigeAcompanhamento ? "Sim (< 6,00)" : "Não"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Matrícula</p>
          <p className="text-lg font-semibold text-slate-800">
            {extrato.aluno.matriculaGeral ?? "-"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Elogios</p>
          <p className="text-lg font-semibold text-slate-800">
            {extrato.resumoElogios.quantidade} (+
            {extrato.resumoElogios.pontosTotais.toFixed(2)})
          </p>
        </div>
      </section>

      {podeElogiar || podeAjustar ? (
        <section className="mb-6 space-y-3">
          {podeElogiar ? (
            <RegistrarElogioForm alunoId={extrato.aluno.id} tipos={tiposElogio} />
          ) : null}
          {podeAjustar ? (
            <RegistrarAjusteForm alunoId={extrato.aluno.id} />
          ) : null}
        </section>
      ) : null}

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-2 text-base font-semibold text-slate-950">
          Ficha Disciplinar (FAD)
        </h2>
        {ficha ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">
              Versão {ficha.versao} · gerada em{" "}
              {formatarData(ficha.geradoEm)} por {ficha.geradoPor.nome}
            </p>
            <p className="break-all font-mono text-xs text-slate-500">
              sha256: {ficha.hash}
            </p>
            <a
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              href={`/disciplina/comportamento/${extrato.aluno.id}/fad`}
              rel="noreferrer"
              target="_blank"
            >
              Baixar FAD (PDF)
            </a>
            <VerConteudoFicha fichaId={ficha.id} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Nenhuma FAD gerada para este aluno.
          </p>
        )}
        {podeGerarFicha ? (
          <div className="mt-3">
            <GerarFichaForm alunoId={extrato.aluno.id} />
          </div>
        ) : null}
      </section>

      <h2 className="mb-2 text-base font-semibold text-slate-950">
        Histórico de movimentos ({extrato.totalMovimentos})
        {extrato.totalPaginas > 1
          ? ` · página ${extrato.paginaAtual} de ${extrato.totalPaginas}`
          : ""}
      </h2>
      <DataTable
        columns={columns}
        emptyMessage="Nenhum movimento. Saldo inicial 8,00."
        getRowId={(row) => row.id}
        rows={extrato.linhas}
      />

      {extrato.totalPaginas > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {extrato.paginaAtual > 1 ? (
            <Link
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              href={`/disciplina/comportamento/${alunoId}?pagina=${extrato.paginaAtual - 1}`}
            >
              Anterior
            </Link>
          ) : null}
          <span className="text-slate-500">
            Página {extrato.paginaAtual} de {extrato.totalPaginas}
          </span>
          {extrato.paginaAtual < extrato.totalPaginas ? (
            <Link
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              href={`/disciplina/comportamento/${alunoId}?pagina=${extrato.paginaAtual + 1}`}
            >
              Próxima
            </Link>
          ) : null}
        </div>
      ) : null}
    </AdminPage>
  );
}
