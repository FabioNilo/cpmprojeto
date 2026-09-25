import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  createAgravanteAction,
  createAtenuanteAction,
  createTipoElogioAction,
  createTransgressaoAction,
  toggleAgravanteAction,
  toggleAtenuanteAction,
  toggleTipoElogioAction,
  toggleTransgressaoAction,
  updateAgravanteAction,
  updateAtenuanteAction,
  updateTipoElogioAction,
  updateTransgressaoAction,
} from "@/modules/disciplina/actions/catalogo-actions";
import { ItemSimplesForm } from "@/modules/disciplina/components/item-simples-form";
import { TipoElogioForm } from "@/modules/disciplina/components/tipo-elogio-form";
import { ToggleCatalogoForm } from "@/modules/disciplina/components/toggle-catalogo-form";
import { TransgressaoForm } from "@/modules/disciplina/components/transgressao-form";
import { listCatalogosDisciplinares } from "@/modules/disciplina/queries/list-catalogos";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

type Catalogos = Awaited<ReturnType<typeof listCatalogosDisciplinares>>;

export default async function CatalogosDisciplinaresPage() {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_READ,
  );
  const canManage = context.permissoes.includes(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const catalogos = await listCatalogosDisciplinares();

  const statusCol = <T extends { ativo: boolean }>(): Column<T> => ({
    header: "Status",
    render: (row) => (row.ativo ? "Ativo" : "Inativo"),
  });

  type Transgressao = Catalogos["transgressoes"][number];
  const transgressaoColumns: Column<Transgressao>[] = [
    { header: "Código", render: (row) => row.codigo },
    { header: "Natureza", render: (row) => row.natureza },
    { header: "Descrição", render: (row) => row.descricao },
    { header: "Base legal", render: (row) => row.baseLegal ?? "-" },
    statusCol<Transgressao>(),
  ];
  if (canManage) {
    transgressaoColumns.push({
      header: "Ações",
      render: (row) => (
        <div className="flex flex-col gap-2">
          <ToggleCatalogoForm
            action={toggleTransgressaoAction}
            ativo={row.ativo}
            id={row.id}
          />
          <TransgressaoForm
            action={updateTransgressaoAction}
            baseLegal={row.baseLegal}
            codigo={row.codigo}
            descricao={row.descricao}
            id={row.id}
            natureza={row.natureza}
          />
        </div>
      ),
    });
  }

  type ItemSimples = Catalogos["atenuantes"][number];
  const itemSimplesColumns = (
    toggleAction: (formData: FormData) => Promise<void>,
    updateAction: Parameters<typeof ItemSimplesForm>[0]["action"],
  ): Column<ItemSimples>[] => {
    const cols: Column<ItemSimples>[] = [
      { header: "Código", render: (row) => row.codigo },
      { header: "Descrição", render: (row) => row.descricao },
      statusCol<ItemSimples>(),
    ];
    if (canManage) {
      cols.push({
        header: "Ações",
        render: (row) => (
          <div className="flex flex-col gap-2">
            <ToggleCatalogoForm
              action={toggleAction}
              ativo={row.ativo}
              id={row.id}
            />
            <ItemSimplesForm
              action={updateAction}
              codigo={row.codigo}
              descricao={row.descricao}
              id={row.id}
              rotuloAcao="Salvar"
            />
          </div>
        ),
      });
    }
    return cols;
  };

  type TipoElogio = Catalogos["tiposElogio"][number];
  const tipoElogioColumns: Column<TipoElogio>[] = [
    { header: "Código", render: (row) => row.codigo },
    { header: "Nome", render: (row) => row.nome },
    { header: "Valor (pontos)", render: (row) => row.valorPontos.toString() },
    statusCol<TipoElogio>(),
  ];
  if (canManage) {
    tipoElogioColumns.push({
      header: "Ações",
      render: (row) => (
        <div className="flex flex-col gap-2">
          <ToggleCatalogoForm
            action={toggleTipoElogioAction}
            ativo={row.ativo}
            id={row.id}
          />
          <TipoElogioForm
            action={updateTipoElogioAction}
            codigo={row.codigo}
            id={row.id}
            nome={row.nome}
            valorPontos={row.valorPontos.toString()}
          />
        </div>
      ),
    });
  }

  type TipoSancao = Catalogos["tiposSancao"][number];
  const tipoSancaoColumns: Column<TipoSancao>[] = [
    { header: "Ordem", render: (row) => row.ordem },
    { header: "Código", render: (row) => row.codigo },
    { header: "Nome", render: (row) => row.nome },
    {
      header: "Impacto pontos",
      render: (row) => row.impactoPontos.toString(),
    },
    {
      header: "Gera afastamento",
      render: (row) => (row.geraAfastamento ? "Sim" : "Não"),
    },
    {
      header: "Desligamento",
      render: (row) => (row.ehDesligamento ? "Sim" : "Não"),
    },
    statusCol<TipoSancao>(),
  ];

  type Faixa = Catalogos["faixasComportamento"][number];
  const faixaColumns: Column<Faixa>[] = [
    { header: "Ordem", render: (row) => row.ordem },
    { header: "Código", render: (row) => row.codigo },
    { header: "Nome", render: (row) => row.nome },
    {
      header: "Faixa",
      render: (row) =>
        `${row.limiteInferior.toString()} a ${row.limiteSuperior.toString()}`,
    },
    {
      header: "Acompanhamento",
      render: (row) => (row.exigeAcompanhamento ? "Sim" : "Não"),
    },
    statusCol<Faixa>(),
  ];

  type Competencia = Catalogos["competencias"][number];
  const competenciaColumns: Column<Competencia>[] = [
    { header: "Perfil", render: (row) => row.perfilCodigo },
    { header: "Ato", render: (row) => row.tipoAto },
    {
      header: "Sanção máxima",
      render: (row) => row.tipoSancaoMaxCodigo ?? "-",
    },
    { header: "Dias máx.", render: (row) => row.diasMax ?? "-" },
    { header: "Natureza máx.", render: (row) => row.naturezaMax ?? "-" },
    statusCol<Competencia>(),
  ];

  type Prazo = Catalogos["prazos"][number];
  const prazoColumns: Column<Prazo>[] = [
    { header: "Código", render: (row) => row.codigo },
    { header: "Nome", render: (row) => row.nome },
    {
      header: "Prazo",
      render: (row) => `${row.quantidade} ${row.unidade}`,
    },
    { header: "Descrição", render: (row) => row.descricao ?? "-" },
    statusCol<Prazo>(),
  ];

  return (
    <AdminPage
      description="Catálogos parametrizáveis do módulo disciplinar (globais, iguais para todos os CPMs). Sanções, faixas de comportamento, competências e prazos vêm do regulamento; transgressões, atenuantes, agravantes e tipos de elogio são mantidos aqui."
      eyebrow="Disciplina"
      title="Catálogos disciplinares"
    >
      <FormSection
        description="Faltas passíveis de enquadramento. A natureza (leve/média/grave/eliminatória) orienta competência e prazos."
        title="Transgressões"
      >
        {canManage ? (
          <div className="mb-4">
            <TransgressaoForm action={createTransgressaoAction} />
          </div>
        ) : null}
        <DataTable
          columns={transgressaoColumns}
          emptyMessage="Nenhuma transgressão cadastrada."
          getRowId={(row) => row.id}
          rows={catalogos.transgressoes}
        />
      </FormSection>

      <FormSection
        description="Circunstâncias que atenuam a análise disciplinar (anexoA seção 5)."
        title="Atenuantes"
      >
        {canManage ? (
          <div className="mb-4">
            <ItemSimplesForm
              action={createAtenuanteAction}
              rotuloAcao="Adicionar atenuante"
            />
          </div>
        ) : null}
        <DataTable
          columns={itemSimplesColumns(
            toggleAtenuanteAction,
            updateAtenuanteAction,
          )}
          emptyMessage="Nenhum atenuante cadastrado."
          getRowId={(row) => row.id}
          rows={catalogos.atenuantes}
        />
      </FormSection>

      <FormSection
        description="Circunstâncias que agravam a análise disciplinar (anexoA seção 5)."
        title="Agravantes"
      >
        {canManage ? (
          <div className="mb-4">
            <ItemSimplesForm
              action={createAgravanteAction}
              rotuloAcao="Adicionar agravante"
            />
          </div>
        ) : null}
        <DataTable
          columns={itemSimplesColumns(
            toggleAgravanteAction,
            updateAgravanteAction,
          )}
          emptyMessage="Nenhum agravante cadastrado."
          getRowId={(row) => row.id}
          rows={catalogos.agravantes}
        />
      </FormSection>

      <FormSection
        description="Reconhecimentos que geram movimento positivo de pontuação."
        title="Tipos de elogio"
      >
        {canManage ? (
          <div className="mb-4">
            <TipoElogioForm action={createTipoElogioAction} />
          </div>
        ) : null}
        <DataTable
          columns={tipoElogioColumns}
          emptyMessage="Nenhum tipo de elogio cadastrado."
          getRowId={(row) => row.id}
          rows={catalogos.tiposElogio}
        />
      </FormSection>

      <FormSection
        description="Escala do regulamento e o impacto de cada sanção na pontuação (anexoA seção 6). Somente leitura."
        title="Tipos de sanção"
      >
        <DataTable
          columns={tipoSancaoColumns}
          emptyMessage="Catálogo não semeado."
          getRowId={(row) => row.id}
          rows={catalogos.tiposSancao}
        />
      </FormSection>

      <FormSection
        description="Faixas de comportamento por pontuação (anexoA seção 8). Somente leitura."
        title="Faixas de comportamento"
      >
        <DataTable
          columns={faixaColumns}
          emptyMessage="Catálogo não semeado."
          getRowId={(row) => row.id}
          rows={catalogos.faixasComportamento}
        />
      </FormSection>

      <FormSection
        description="Alçada de cada perfil para aplicar sanção e decidir reconsideração (anexoA seções 7 e 12). Somente leitura."
        title="Competências disciplinares"
      >
        <DataTable
          columns={competenciaColumns}
          emptyMessage="Catálogo não semeado."
          getRowId={(row) => row.id}
          rows={catalogos.competencias}
        />
      </FormSection>

      <FormSection
        description="Prazos do regulamento (anexoA seções 10, 12 e 13). O prazo de 48h é só para falta/atraso escolar. Somente leitura."
        title="Prazos processuais"
      >
        <DataTable
          columns={prazoColumns}
          emptyMessage="Catálogo não semeado."
          getRowId={(row) => row.id}
          rows={catalogos.prazos}
        />
      </FormSection>
    </AdminPage>
  );
}
