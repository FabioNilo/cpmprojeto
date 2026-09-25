"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/modules/auth/actions/login-action";
import type { LoginState } from "@/modules/auth/actions/login-action";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-11 w-full items-center justify-center rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={pending}
      type="submit"
    >
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

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

      <div>
        <label
          className="mb-2 block text-sm font-medium text-slate-700"
          htmlFor="password"
        >
          Senha
        </label>
        <div className="flex rounded-md border border-slate-300 focus-within:border-gold-500 focus-within:ring-2 focus-within:ring-gold-500/20">
          <input
            autoComplete="current-password"
            className="h-11 min-w-0 flex-1 rounded-l-md border-0 px-3 text-sm outline-none"
            id="password"
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button
            className="h-11 shrink-0 rounded-r-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
            onClick={() => setShowPassword((current) => !current)}
            type="button"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            className="h-4 w-4 rounded border-slate-300 text-navy-900"
            name="remember"
            type="checkbox"
          />
          Lembrar-me
        </label>
        <Link
          className="text-sm font-medium text-navy-900 hover:underline"
          href="/forgot-password"
        >
          Esqueci minha senha
        </Link>
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
