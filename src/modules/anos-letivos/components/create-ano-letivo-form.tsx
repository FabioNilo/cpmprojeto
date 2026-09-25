"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { createAnoLetivoAction } from "../actions/ano-letivo-actions";

export function CreateAnoLetivoForm() {
  const [state, formAction] = useActionState(
    createAnoLetivoAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <TextField
        defaultValue={String(new Date().getFullYear())}
        label="Ano letivo"
        name="ano"
        placeholder="Ex.: 2026"
        required
        type="number"
      />
      <div className="space-y-2">
        <SubmitButton pendingLabel="Abrindo...">Abrir ano letivo</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
