"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";
import { changePasswordAction } from "@/modules/auth/actions/change-password-action";

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(
    changePasswordAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="max-w-sm space-y-3">
      <TextField
        autoComplete="current-password"
        label="Senha atual"
        name="senhaAtual"
        placeholder="Digite sua senha atual"
        required
        type="password"
      />
      <TextField
        autoComplete="new-password"
        label="Nova senha"
        name="novaSenha"
        placeholder="Mínimo 8 caracteres"
        required
        type="password"
      />
      <TextField
        autoComplete="new-password"
        label="Confirmar nova senha"
        name="confirmarSenha"
        placeholder="Repita a nova senha"
        required
        type="password"
      />
      <div className="space-y-2">
        <SubmitButton pendingLabel="Alterando...">Alterar senha</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
