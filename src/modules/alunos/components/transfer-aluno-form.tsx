"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";

import { transferAlunoAction } from "../actions/aluno-actions";

type TransferAlunoFormProps = {
  alunos: Array<{
    id: string;
    nome: string;
    matriculaGeral: string | null;
  }>;
  colegiosDestino: Array<{
    id: string;
    codigo: string;
    nome: string;
  }>;
  turmasDestino: Array<{
    id: string;
    nome: string;
    colegioId: string;
    colegio: {
      codigo: string;
    };
    anoLetivo: {
      ano: number;
    };
  }>;
  defaultDate: string;
};

export function TransferAlunoForm({
  alunos,
  colegiosDestino,
  turmasDestino,
  defaultDate,
}: TransferAlunoFormProps) {
  const [state, formAction] = useActionState(
    transferAlunoAction,
    idleActionState,
  );

  if (alunos.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Não há aluno ativo no CPM de origem para transferência.
      </p>
    );
  }

  if (colegiosDestino.length === 0) {
    return (
      <p className="text-sm text-slate-600">
        Não há outro CPM ativo disponível para receber transferência.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Aluno ativo na origem"
          name="alunoId"
          options={alunos.map((aluno) => ({
            label: aluno.matriculaGeral
              ? `${aluno.nome} - ${aluno.matriculaGeral}`
              : aluno.nome,
            value: aluno.id,
          }))}
          required
        />
        <SelectField
          label="CPM de destino"
          name="destinoColegioId"
          options={colegiosDestino.map((colegio) => ({
            label: `${colegio.codigo} - ${colegio.nome}`,
            value: colegio.id,
          }))}
          required
        />
        <SelectField
          label="Turma no destino"
          name="destinoTurmaId"
          options={[
            { label: "Definir depois no CPM de destino", value: "" },
            ...turmasDestino.map((turma) => ({
              label: `${turma.colegio.codigo} - ${turma.nome} - ${turma.anoLetivo.ano}`,
              value: turma.id,
            })),
          ]}
        />
        <TextField
          label="Número no destino"
          name="numero"
          placeholder="Ex.: 12"
        />
        <TextField
          defaultValue={defaultDate}
          label="Data da transferencia"
          name="dataTransferencia"
          required
          type="date"
        />
        <TextField
          label="Motivo administrativo"
          name="motivo"
          placeholder="Ex.: Mudança de turma solicitada pela coordenação"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingLabel="Transferindo...">
          Transferir aluno
        </SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
