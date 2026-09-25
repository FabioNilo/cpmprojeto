"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updateOcorrenciaAction } from "../actions/ocorrencia-actions";

type EditarOcorrenciaFormProps = {
  id: string;
  tipo: string;
  dataOcorrencia: string;
  local: string | null;
  materia: string | null;
  descricao: string;
  sigiloso: boolean;
};

const tipoOptions = [
  { label: "Disciplinar", value: "DISCIPLINAR" },
  { label: "Falta escolar", value: "FALTA_ESCOLAR" },
  { label: "Atraso escolar", value: "ATRASO_ESCOLAR" },
];

export function EditarOcorrenciaForm({
  id,
  tipo,
  dataOcorrencia,
  local,
  materia,
  descricao,
  sigiloso,
}: EditarOcorrenciaFormProps) {
  const [state, formAction] = useActionState(
    updateOcorrenciaAction,
    idleActionState,
  );

  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Editar comunicação
      </summary>
      <form action={formAction} className="mt-3 grid gap-3 md:grid-cols-2">
        <input name="id" type="hidden" value={id} />
        <SelectField
          defaultValue={tipo}
          label="Tipo"
          name="tipo"
          options={tipoOptions}
          required
        />
        <TextField
          defaultValue={dataOcorrencia}
          label="Data e hora do fato"
          name="dataOcorrencia"
          required
          type="datetime-local"
        />
        <div className="md:col-span-2">
          <TextField
            defaultValue={local ?? ""}
            label="Local"
            name="local"
            placeholder="Ex.: Pátio interno"
          />
        </div>
        <div className="md:col-span-2">
          <TextField
            defaultValue={materia ?? ""}
            label="Disciplinar (componente curricular)"
            name="materia"
            placeholder="Ex.: Língua Portuguesa"
          />
        </div>
        <div className="md:col-span-2">
          <TextAreaField
            defaultValue={descricao}
            label="Descrição do fato"
            name="descricao"
            placeholder="Relate o fato observado. Não é enquadramento nem sanção."
            required
            rows={5}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
          <input
            className="h-4 w-4 rounded border-slate-300"
            defaultChecked={sigiloso}
            name="sigiloso"
            type="checkbox"
          />
          Ocorrência sigilosa
        </label>
        <div className="space-y-2 md:col-span-2">
          <SubmitButton pendingLabel="Salvando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
