"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { createColegioAction } from "../actions/colegio-actions";

export function CreateColegioForm() {
  const [state, formAction] = useActionState(
    createColegioAction,
    idleActionState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 md:grid-cols-[1fr_180px_auto]"
    >
      <TextField
        label="Nome"
        name="nome"
        placeholder="Ex.: Colégio da Polícia Militar Rômulo Galvão"
        required
      />
      <TextField
        label="Código"
        name="codigo"
        placeholder="CPM-BA-..."
        required
      />
      <div className="flex items-end">
        <SubmitButton>Criar</SubmitButton>
      </div>
      <div className="md:col-span-3">
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
