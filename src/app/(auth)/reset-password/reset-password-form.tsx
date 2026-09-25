"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  confirmPasswordResetAction,
  type ConfirmResetState,
} from "@/modules/auth/actions/confirm-password-reset-action";

const initialState: ConfirmResetState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-11 w-full items-center justify-center rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Salvando..." : "Definir nova senha"}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    confirmPasswordResetAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input name="token" type="hidden" value={token} />
      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Nova senha
        </label>
        <input
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </div>
      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-700"
          htmlFor="confirmarSenha"
        >
          Confirmar nova senha
        </label>
        <input
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          id="confirmarSenha"
          minLength={8}
          name="confirmarSenha"
          required
          type="password"
        />
      </div>
      {state.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
