"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updateColegioAction } from "../actions/colegio-actions";

type UpdateColegioFormProps = {
  id: string;
  nome: string;
  codigo: string;
};

export function UpdateColegioForm({
  id,
  nome,
  codigo,
}: UpdateColegioFormProps) {
  const [state, formAction] = useActionState(
    updateColegioAction,
    idleActionState,
  );

  return (
    <details className="w-72 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Editar
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input name="id" type="hidden" value={id} />
        <TextField
          defaultValue={nome}
          label="Nome"
          name="nome"
          placeholder="Ex.: Colégio da Polícia Militar Rômulo Galvão"
          required
        />
        <TextField
          defaultValue={codigo}
          label="Código"
          name="codigo"
          placeholder="CPM-BA-..."
          required
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Atualizando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
