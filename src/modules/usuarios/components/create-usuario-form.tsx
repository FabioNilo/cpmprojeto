"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { createUsuarioAction } from "../actions/usuario-actions";

type CreateUsuarioFormProps = {
  perfis: Array<{
    id: number;
    nome: string;
    codigo: string;
  }>;
};

export function CreateUsuarioForm({ perfis }: CreateUsuarioFormProps) {
  const [state, formAction] = useActionState(
    createUsuarioAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nome"
          name="nome"
          placeholder="Ex.: João da Silva Santos"
          required
        />
        <TextField
          label="Posto/graduação"
          name="posto"
          placeholder="Ex.: 1º TEN PM"
        />
        <TextField
          label="Usuário"
          name="username"
          placeholder="Ex.: joao.santos"
          required
        />
        <TextField
          label="Email"
          name="email"
          placeholder="Ex.: joao.santos@exemplo.com"
          type="email"
        />
        <TextField
          label="CPF"
          name="cpf"
          placeholder="Somente números, 11 dígitos"
        />
        <TextField
          label="Senha inicial"
          name="password"
          placeholder="Mínimo 8 caracteres"
          required
          type="password"
        />
        <SelectField
          label="Perfil no colegio ativo"
          name="perfilId"
          options={perfis.map((perfil) => ({
            label: `${perfil.nome} (${perfil.codigo})`,
            value: String(perfil.id),
          }))}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton>Criar usuário</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
