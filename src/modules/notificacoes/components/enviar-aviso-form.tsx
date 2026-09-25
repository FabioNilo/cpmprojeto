"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { enviarAvisoManualAction } from "../actions/notificacao-actions";

type EnviarAvisoFormProps = {
  responsavelId: string;
};

export function EnviarAvisoForm({ responsavelId }: EnviarAvisoFormProps) {
  const [state, formAction] = useActionState(
    enviarAvisoManualAction,
    idleActionState,
  );

  return (
    <details className="w-80 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Enviar aviso
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input name="responsavelId" type="hidden" value={responsavelId} />
        <TextField
          label="Título"
          name="titulo"
          placeholder="Ex.: Reunião de pais"
          required
        />
        <TextAreaField
          label="Mensagem"
          name="mensagem"
          placeholder="Escreva o aviso para o responsável."
          required
          rows={3}
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Enviando...">Enviar aviso</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
