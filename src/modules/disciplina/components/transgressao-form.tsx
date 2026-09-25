"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState, type ActionState } from "@/lib/actions/action-state";

import { NATUREZAS_TRANSGRESSAO } from "../constants";

type TransgressaoFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  id?: string;
  codigo?: string;
  descricao?: string;
  natureza?: string;
  baseLegal?: string | null;
};

const naturezaOptions = NATUREZAS_TRANSGRESSAO.map((valor) => ({
  label: valor,
  value: valor,
}));

export function TransgressaoForm({
  action,
  id,
  codigo,
  descricao,
  natureza,
  baseLegal,
}: TransgressaoFormProps) {
  const [state, formAction] = useActionState(action, idleActionState);

  const campos = (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      {id ? <input name="id" type="hidden" value={id} /> : null}
      {id ? null : (
        <TextField label="Código" name="codigo" placeholder="ART_10_III" required />
      )}
      <SelectField
        defaultValue={natureza ?? "LEVE"}
        label="Natureza"
        name="natureza"
        options={naturezaOptions}
        required
      />
      <div className="md:col-span-2">
        <TextField
          defaultValue={descricao ?? ""}
          label="Descrição"
          name="descricao"
          placeholder="Ex.: Desrespeitar superior hierárquico"
          required
        />
      </div>
      <div className="md:col-span-2">
        <TextField
          defaultValue={baseLegal ?? ""}
          label="Base legal (artigo)"
          name="baseLegal"
          placeholder="Ex.: Art. 10, III"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <SubmitButton pendingLabel="Salvando...">
          {id ? "Salvar" : "Adicionar transgressão"}
        </SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );

  if (!id) {
    return campos;
  }

  return (
    <details className="w-full rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Editar {codigo}
      </summary>
      <div className="mt-3">{campos}</div>
    </details>
  );
}
