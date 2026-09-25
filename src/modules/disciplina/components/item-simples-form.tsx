"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState, type ActionState } from "@/lib/actions/action-state";

type ItemSimplesFormProps = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  rotuloAcao: string;
  id?: string;
  codigo?: string;
  descricao?: string;
};

export function ItemSimplesForm({
  action,
  rotuloAcao,
  id,
  codigo,
  descricao,
}: ItemSimplesFormProps) {
  const [state, formAction] = useActionState(action, idleActionState);

  const campos = (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      {id ? <input name="id" type="hidden" value={id} /> : null}
      {id ? null : (
        <TextField label="Código" name="codigo" placeholder="PRIMEIRA_FALTA" required />
      )}
      <div className={id ? "md:col-span-2" : ""}>
        <TextField
          defaultValue={descricao ?? ""}
          label="Descrição"
          name="descricao"
          placeholder="Ex.: Primeira falta não justificada"
          required
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <SubmitButton pendingLabel="Salvando...">
          {id ? "Salvar" : rotuloAcao}
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
