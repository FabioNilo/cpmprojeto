"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { createAlunoAction } from "../actions/aluno-actions";

type CreateAlunoFormProps = {
  turmas: Array<{
    id: string;
    nome: string;
    anoLetivo: {
      ano: number;
    };
  }>;
};

export function CreateAlunoForm({ turmas }: CreateAlunoFormProps) {
  const [state, formAction] = useActionState(
    createAlunoAction,
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
          label="Matrícula geral"
          name="matriculaGeral"
          placeholder="Ex.: 24109"
        />
        <SelectField
          label="Turma inicial"
          name="turmaId"
          options={[
            { label: "Sem turma neste momento", value: "" },
            ...turmas.map((turma) => ({
              label: `${turma.nome} - ${turma.anoLetivo.ano}`,
              value: turma.id,
            })),
          ]}
        />
        <TextField
          label="Número na turma"
          name="numero"
          placeholder="Ex.: 12"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          className="h-4 w-4 rounded border-slate-300"
          name="necessidadeEspecial"
          type="checkbox"
        />
        Aluno com necessidade especial (ex.: neurodivergência) — libera
        pontuação manual da sanção
      </label>
      <div className="flex items-center gap-3">
        <SubmitButton>Salvar aluno</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
