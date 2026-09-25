"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { regenerarSenhaResponsavelAction } from "../actions/responsavel-actions";

export function RegenerarSenhaForm({ id }: { id: string }) {
  const [state, action] = useActionState(
    regenerarSenhaResponsavelAction,
    idleActionState,
  );
  return (
    <form action={action} className="space-y-1">
      <input name="id" type="hidden" value={id} />
      <SubmitButton pendingLabel="Gerando..." variant="secondary">
        Nova senha provisória
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
