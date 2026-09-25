"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { createTurmaAction } from "../actions/turma-actions";

export function CreateTurmaForm() {
  const [state, formAction] = useActionState(
    createTurmaAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[140px_1fr_1fr]">
        <TextField defaultValue="2026" label="Ano letivo" name="ano" required />
        <TextField
          label="Nome da turma"
          name="nome"
          placeholder="6A"
          required
        />
        <TextField label="Turno" name="turno" placeholder="Matutino" />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Criar turma</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
