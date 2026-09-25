"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { updateUsuarioAction } from "../actions/usuario-actions";

type UpdateUsuarioFormProps = {
  id: string;
  nome: string;
  posto: string | null;
  username: string | null;
  email: string | null;
  cpf: string | null;
  perfilId?: number;
  perfis: Array<{
    id: number;
    nome: string;
    codigo: string;
  }>;
};

export function UpdateUsuarioForm({
  id,
  nome,
  posto,
  username,
  email,
  cpf,
  perfilId,
  perfis,
}: UpdateUsuarioFormProps) {
  const [state, formAction] = useActionState(
    updateUsuarioAction,
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
          placeholder="Ex.: João da Silva Santos"
          required
        />
        <TextField
          defaultValue={posto ?? ""}
          label="Posto/graduação"
          name="posto"
          placeholder="Ex.: 1º TEN PM"
        />
        <TextField
          defaultValue={username ?? ""}
          label="Usuário"
          name="username"
          placeholder="Ex.: joao.santos"
          required
        />
        <TextField
          defaultValue={email ?? ""}
          label="Email"
          name="email"
          placeholder="Ex.: joao.santos@exemplo.com"
          type="email"
        />
        <TextField
          defaultValue={cpf ?? ""}
          label="CPF"
          name="cpf"
          placeholder="Somente números, 11 dígitos"
        />
        <TextField
          label="Nova senha"
          name="password"
          placeholder="Deixe em branco para não alterar"
          type="password"
        />
        <SelectField
          defaultValue={perfilId ? String(perfilId) : undefined}
          label="Perfil no colegio ativo"
          name="perfilId"
          options={perfis.map((perfil) => ({
            label: `${perfil.nome} (${perfil.codigo})`,
            value: String(perfil.id),
          }))}
          required
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Atualizando...">Salvar</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
