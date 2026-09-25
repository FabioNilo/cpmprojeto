"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";
import { SeletorAlunos } from "@/modules/alunos/components/seletor-alunos";

import { createMatriculaAction } from "../actions/matricula-actions";

type TurmaOption = {
  id: string;
  nome: string;
  anoLetivo: { ano: number };
};

type CreateMatriculaFormProps = {
  turmas: TurmaOption[];
  series: string[];
  salasPorSerie: Record<string, string[]>;
  todasSalas: string[];
};

export function CreateMatriculaForm({
  turmas,
  series,
  salasPorSerie,
  todasSalas,
}: CreateMatriculaFormProps) {
  const [state, formAction] = useActionState(
    createMatriculaAction,
    idleActionState,
  );

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <div className="md:col-span-2">
        <SeletorAlunos
          label="Aluno"
          name="alunoId"
          salasPorSerie={salasPorSerie}
          series={series}
          todasSalas={todasSalas}
        />
      </div>
      <SelectField
        label="Turma"
        name="turmaId"
        options={turmas.map((turma) => ({
          label: `${turma.nome} - ${turma.anoLetivo.ano}`,
          value: turma.id,
        }))}
        required
      />
      <TextField
        label="Número (opcional)"
        name="numero"
        placeholder="Ex.: 12"
      />
      <div className="space-y-2 md:col-span-2">
        <SubmitButton pendingLabel="Matriculando...">Matricular</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
