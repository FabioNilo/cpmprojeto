"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { gerarFichaAction } from "../actions/ficha-actions";

export function GerarFichaForm({ alunoId }: { alunoId: string }) {
  const [state, action] = useActionState(gerarFichaAction, idleActionState);
  return (
    <form action={action} className="space-y-2">
      <input name="alunoId" type="hidden" value={alunoId} />
      <SubmitButton pendingLabel="Gerando..." variant="secondary">
        Gerar nova versão da FAD
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
