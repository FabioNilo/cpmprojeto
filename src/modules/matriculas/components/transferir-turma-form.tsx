"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { transferirTurmaMatriculaAction } from "../actions/matricula-actions";

type TurmaOption = {
  id: string;
  nome: string;
  anoLetivo: { ano: number };
};

type TransferirTurmaFormProps = {
  matriculaId: string;
  turmas: TurmaOption[];
};

export function TransferirTurmaForm({
  matriculaId,
  turmas,
}: TransferirTurmaFormProps) {
  const [state, formAction] = useActionState(
    transferirTurmaMatriculaAction,
    idleActionState,
  );

  return (
    <details className="w-64 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Trocar de turma
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input name="id" type="hidden" value={matriculaId} />
        <SelectField
          label="Nova turma"
          name="turmaId"
          options={turmas.map((turma) => ({
            label: `${turma.nome} - ${turma.anoLetivo.ano}`,
            value: turma.id,
          }))}
          required
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Transferindo...">Transferir</SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}
