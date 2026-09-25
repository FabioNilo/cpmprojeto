"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { concluirPrimeiroAcessoAction } from "../actions/primeiro-acesso-action";

export function PrimeiroAcessoForm() {
  const [state, action] = useActionState(
    concluirPrimeiroAcessoAction,
    idleActionState,
  );

  return (
    <form action={action} className="space-y-4">
      <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
        <input
          className="mt-0.5 h-4 w-4 shrink-0"
          name="aceite"
          required
          type="checkbox"
        />
        <span>Li e aceito o Termo de Responsabilidade acima.</span>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Nova senha
        </span>
        <input
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
          minLength={8}
          name="novaSenha"
          required
          type="password"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Repita a nova senha
        </span>
        <input
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
          minLength={8}
          name="confirmarSenha"
          required
          type="password"
        />
      </label>

      <div className="space-y-2">
        <SubmitButton pendingLabel="Salvando...">
          Aceitar e acessar
        </SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
