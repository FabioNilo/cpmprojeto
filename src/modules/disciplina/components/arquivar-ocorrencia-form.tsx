"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";

import { arquivarOcorrenciaAction } from "../actions/ocorrencia-actions";

export function ArquivarOcorrenciaForm({ id }: { id: string }) {
  const [state, formAction] = useActionState(
    arquivarOcorrenciaAction,
    idleActionState,
  );

  return (
    <details className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Arquivar ocorrência
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input name="id" type="hidden" value={id} />
        <TextAreaField
          label="Motivo do arquivamento"
          name="motivo"
          placeholder="Explique por que esta ocorrência está sendo arquivada."
          required
          rows={3}
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Arquivando..." variant="danger">
            Confirmar arquivamento
          </SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
