"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { atenderSolicitacaoSenhaAction } from "../actions/responsavel-actions";

export function AtenderSolicitacaoSenhaForm({ id }: { id: string }) {
  const [state, action] = useActionState(
    atenderSolicitacaoSenhaAction,
    idleActionState,
  );
  return (
    <form action={action} className="space-y-1">
      <input name="id" type="hidden" value={id} />
      <SubmitButton pendingLabel="Gerando...">
        Gerar nova senha e atender
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
