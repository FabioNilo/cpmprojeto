"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updateTurmaAction } from "../actions/turma-actions";

type UpdateTurmaFormProps = {
  id: string;
  ano: number;
  nome: string;
  turno: string | null;
};

export function UpdateTurmaForm({
  id,
  ano,
  nome,
  turno,
}: UpdateTurmaFormProps) {
  const [state, formAction] = useActionState(
    updateTurmaAction,
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
          defaultValue={String(ano)}
          label="Ano letivo"
          name="ano"
          placeholder="Ex.: 2026"
          required
        />
        <TextField
          defaultValue={nome}
          label="Nome da turma"
          name="nome"
          placeholder="Ex.: 6A"
          required
        />
        <TextField
          defaultValue={turno ?? ""}
          label="Turno"
          name="turno"
          placeholder="Matutino"
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Atualizando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
