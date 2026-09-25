import Link from "next/link";

import { FormSection } from "@/components/forms/form-section";
import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";

import type { AuditoriaFilter } from "../schemas/auditoria-filter-schema";

type AuditoriaFiltrosProps = {
  filtros: AuditoriaFilter;
  acoes: string[];
  entidades: string[];
};

export function AuditoriaFiltros({
  filtros,
  acoes,
  entidades,
}: AuditoriaFiltrosProps) {
  return (
    <FormSection
      description="Refina o registro de auditoria por ação, entidade, usuário e período. O escopo é o colégio ativo mais eventos globais de sistema."
      title="Filtros"
    >
      <form className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" method="get">
        <SelectField
          defaultValue={filtros.acao ?? ""}
          label="Ação"
          name="acao"
          options={[
            { label: "Todas", value: "" },
            ...acoes.map((acao) => ({ label: acao, value: acao })),
          ]}
        />
        <SelectField
          defaultValue={filtros.entidade ?? ""}
          label="Entidade"
          name="entidade"
          options={[
            { label: "Todas", value: "" },
            ...entidades.map((entidade) => ({
              label: entidade,
              value: entidade,
            })),
          ]}
        />
        <TextField
          defaultValue={filtros.usuarioId ?? ""}
          label="Usuário (ID)"
          name="usuarioId"
          placeholder="UUID do usuário"
        />
        <TextField
          defaultValue={filtros.de ?? ""}
          label="De"
          name="de"
          type="date"
        />
        <TextField
          defaultValue={filtros.ate ?? ""}
          label="Até"
          name="ate"
          type="date"
        />
        <div className="flex items-end gap-3">
          <button
            className="h-10 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
            type="submit"
          >
            Aplicar
          </button>
          <Link
            className="flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            href="/auditoria"
          >
            Limpar
          </Link>
        </div>
      </form>
    </FormSection>
  );
}
