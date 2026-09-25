"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updatePerfilAction } from "../actions/perfil-actions";

type UpdatePerfilFormProps = {
  id: number;
  nome: string;
  descricao: string | null;
};

export function UpdatePerfilForm({ id, nome, descricao }: UpdatePerfilFormProps) {
  const [state, formAction] = useActionState(
    updatePerfilAction,
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
          placeholder="Ex.: Coordenador Pedagógico"
          required
        />
        <TextField
          defaultValue={descricao ?? ""}
          label="Descrição"
          name="descricao"
          placeholder="Ex.: Responsável pelo acompanhamento pedagógico"
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Atualizando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
