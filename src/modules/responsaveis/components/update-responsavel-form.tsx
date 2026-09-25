"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updateResponsavelAction } from "../actions/responsavel-actions";

type UpdateResponsavelFormProps = {
  id: string;
  nome: string;
  username: string | null;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
};

export function UpdateResponsavelForm({
  id,
  nome,
  username,
  email,
  cpf,
  telefone,
}: UpdateResponsavelFormProps) {
  const [state, formAction] = useActionState(
    updateResponsavelAction,
    idleActionState,
  );

  return (
    <details className="w-80 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Editar
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input name="id" type="hidden" value={id} />
        <TextField
          defaultValue={nome}
          label="Nome"
          name="nome"
          placeholder="Ex.: Maria da Silva Santos"
          required
        />
        <TextField
          defaultValue={username ?? ""}
          label="Usuário"
          name="username"
          placeholder="Ex.: maria.santos"
          required
        />
        <TextField
          defaultValue={email ?? ""}
          label="Email"
          name="email"
          placeholder="Ex.: maria.santos@exemplo.com"
          type="email"
        />
        <TextField
          defaultValue={cpf ?? ""}
          label="CPF"
          name="cpf"
          placeholder="Somente números, 11 dígitos"
        />
        <TextField
          defaultValue={telefone ?? ""}
          label="Telefone"
          name="telefone"
          placeholder="Ex.: (71) 99999-9999"
        />
        <TextField
          label="Nova senha"
          name="password"
          placeholder="Deixe em branco para não alterar"
          type="password"
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Atualizando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
