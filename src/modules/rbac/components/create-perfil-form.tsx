"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { createPerfilAction } from "../actions/perfil-actions";

export function CreatePerfilForm() {
  const [state, formAction] = useActionState(
    createPerfilAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <TextField
        label="Código"
        name="codigo"
        placeholder="COORDENADOR_PEDAGOGICO"
        required
      />
      <TextField
        label="Nome"
        name="nome"
        placeholder="Coordenador Pedagógico"
        required
      />
      <div className="md:col-span-2">
        <TextField
          label="Descrição"
          name="descricao"
          placeholder="Ex.: Responsável pelo acompanhamento pedagógico"
        />
      </div>
      <div className="space-y-2 md:col-span-2">
        <SubmitButton pendingLabel="Criando...">Criar perfil</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
