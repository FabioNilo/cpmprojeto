"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";

import { registrarElogioAction } from "../actions/elogio-actions";
import {
  processarRestauracoesAction,
  registrarAjusteAction,
} from "../actions/pontuacao-actions";

type TipoElogio = { codigo: string; nome: string; valorPontos: number };

export function RegistrarElogioForm({
  alunoId,
  tipos,
}: {
  alunoId: string;
  tipos: TipoElogio[];
}) {
  const [state, action] = useActionState(registrarElogioAction, idleActionState);
  return (
    <details className="rounded-md border border-slate-200 bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Registrar elogio
      </summary>
      <form action={action} className="mt-3 space-y-3">
        <input name="alunoId" type="hidden" value={alunoId} />
        <SelectField
          label="Tipo de elogio"
          name="tipoElogioCodigo"
          options={tipos.map((t) => ({
            label: `${t.nome} (+${t.valorPontos.toFixed(2)})`,
            value: t.codigo,
          }))}
          required
        />
        <TextAreaField
          label="Descrição"
          name="descricao"
          placeholder="Ex.: Auxiliou colega com dificuldade em atividade escolar."
          required
          rows={3}
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Registrando...">
            Registrar elogio
          </SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}

export function RegistrarAjusteForm({ alunoId }: { alunoId: string }) {
  const [state, action] = useActionState(registrarAjusteAction, idleActionState);
  return (
    <details className="rounded-md border border-slate-200 bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Ajuste administrativo de pontos
      </summary>
      <form action={action} className="mt-3 space-y-3">
        <input name="alunoId" type="hidden" value={alunoId} />
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Valor (positivo ou negativo, ex.: -0.10 ou 0.25)
          </span>
          <input
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
            name="valor"
            placeholder="0.00"
            step="0.01"
            type="number"
          />
        </label>
        <TextAreaField
          label="Motivo"
          name="motivo"
          placeholder="Justifique o ajuste manual de pontuação."
          required
          rows={3}
        />
        <div className="space-y-2">
          <SubmitButton pendingLabel="Registrando..." variant="secondary">
            Registrar ajuste
          </SubmitButton>
          <ActionFeedback state={state} />
        </div>
      </form>
    </details>
  );
}

export function ProcessarRestauracoesForm() {
  const [state, action] = useActionState(
    processarRestauracoesAction,
    idleActionState,
  );
  return (
    <form action={action} className="space-y-2">
      <SubmitButton pendingLabel="Processando..." variant="secondary">
        Processar restaurações anuais devidas
      </SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
