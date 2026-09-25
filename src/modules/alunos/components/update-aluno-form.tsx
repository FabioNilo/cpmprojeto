"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updateAlunoAction } from "../actions/aluno-actions";

type UpdateAlunoFormProps = {
  id: string;
  nome: string;
  matriculaGeral: string | null;
  necessidadeEspecial: boolean;
};

export function UpdateAlunoForm({
  id,
  nome,
  matriculaGeral,
  necessidadeEspecial,
}: UpdateAlunoFormProps) {
  const [state, formAction] = useActionState(
    updateAlunoAction,
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
          placeholder="Ex.: João da Silva Santos"
          required
        />
        <TextField
          defaultValue={matriculaGeral ?? ""}
          label="Matrícula geral"
          name="matriculaGeral"
          placeholder="Ex.: 24109"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            className="h-4 w-4 rounded border-slate-300"
            defaultChecked={necessidadeEspecial}
            name="necessidadeEspecial"
            type="checkbox"
          />
          Necessidade especial (libera pontuação manual da sanção)
        </label>
        <div className="space-y-2">
          <SubmitButton pendingLabel="Atualizando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
