"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";
import { SeletorAlunos } from "@/modules/alunos/components/seletor-alunos";

import { createResponsavelAction } from "../actions/responsavel-actions";

type CreateResponsavelFormProps = {
  series: string[];
  salasPorSerie: Record<string, string[]>;
  todasSalas: string[];
};

export function CreateResponsavelForm({
  series,
  salasPorSerie,
  todasSalas,
}: CreateResponsavelFormProps) {
  const [state, formAction] = useActionState(
    createResponsavelAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Nome"
          name="nome"
          placeholder="Ex.: Maria da Silva Santos"
          required
        />
        <TextField
          label="Usuário"
          name="username"
          placeholder="Ex.: maria.santos"
          required
        />
        <TextField
          label="Email"
          name="email"
          placeholder="Ex.: maria.santos@exemplo.com"
          type="email"
        />
        <TextField
          label="CPF"
          name="cpf"
          placeholder="Somente números, 11 dígitos"
        />
        <TextField
          label="Telefone"
          name="telefone"
          placeholder="Ex.: (71) 99999-9999"
        />
        <TextField
          label="Parentesco"
          name="parentesco"
          placeholder="Ex.: Mãe, Pai, Avó"
        />
      </div>
      <div className="rounded-md border border-slate-200 p-3">
        <SeletorAlunos
          label="Aluno vinculado"
          name="alunoId"
          salasPorSerie={salasPorSerie}
          series={series}
          todasSalas={todasSalas}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          className="h-4 w-4 rounded border-slate-300 text-navy-900"
          name="principal"
          type="checkbox"
        />
        Responsável principal
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton>Criar responsável</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
