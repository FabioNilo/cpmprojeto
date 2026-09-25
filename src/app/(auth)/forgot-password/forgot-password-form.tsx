"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestPasswordResetAction,
  type RequestResetState,
} from "@/modules/auth/actions/request-password-reset-action";

const initialState: RequestResetState = { enviado: false };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-11 w-full items-center justify-center rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Enviando..." : "Enviar instruções"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  if (state.enviado && state.mensagem) {
    return (
      <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        {state.mensagem}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-700"
          htmlFor="identifier"
        >
          CPF ou usuário
        </label>
        <input
          autoComplete="username"
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          id="identifier"
          name="identifier"
          required
        />
      </div>
      <SubmitButton />
    </form>
  );
}
