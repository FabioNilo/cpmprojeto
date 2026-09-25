"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { reativarMatriculaAction } from "../actions/matricula-actions";

type ReativarMatriculaFormProps = {
  matriculaId: string;
};

export function ReativarMatriculaForm({
  matriculaId,
}: ReativarMatriculaFormProps) {
  const [state, formAction] = useActionState(
    reativarMatriculaAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input name="id" type="hidden" value={matriculaId} />
      <SubmitButton pendingLabel="Reativando..." variant="secondary">
        Reativar
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
