"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { cancelarMatriculaAction } from "../actions/matricula-actions";

type CancelarMatriculaFormProps = {
  matriculaId: string;
};

export function CancelarMatriculaForm({
  matriculaId,
}: CancelarMatriculaFormProps) {
  const [state, formAction] = useActionState(
    cancelarMatriculaAction,
    idleActionState,
  );

  return (
    <details className="w-64 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Cancelar matricula
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input name="id" type="hidden" value={matriculaId} />
        <TextField
          label="Motivo (opcional)"
          name="motivo"
          placeholder="Ex.: Transferência de turma"
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Cancelando..." variant="danger">
            Confirmar cancelamento
          </SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
