"use client";

import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";

import {
  decidirReconsideracaoAction,
  solicitarReconsideracaoAction,
} from "../actions/reconsideracao-actions";

type ReconsideracaoAcoesProps = {
  sancaoId: string;
  podeSolicitar: boolean;
  podeDecidir: boolean;
  reconsideracaoPendenteId: string | null;
  tiposSancao: Array<{ codigo: string; nome: string; ordem: number }>;
};

export function ReconsideracaoAcoes({
  sancaoId,
  podeSolicitar,
  podeDecidir,
  reconsideracaoPendenteId,
  tiposSancao,
}: ReconsideracaoAcoesProps) {
  const [solState, solAction] = useActionState(
    solicitarReconsideracaoAction,
    idleActionState,
  );
  const [decState, decAction] = useActionState(
    decidirReconsideracaoAction,
    idleActionState,
  );
  const [resultado, setResultado] = useState("INDEFERIR");

  const mostrarDecidir = podeDecidir && reconsideracaoPendenteId;
  const mostrarSolicitar = podeSolicitar && !reconsideracaoPendenteId;

  if (!mostrarDecidir && !mostrarSolicitar) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {mostrarSolicitar ? (
        <details className="rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Solicitar reconsideração
          </summary>
          <form action={solAction} className="mt-3 space-y-3">
            <input name="sancaoId" type="hidden" value={sancaoId} />
            <TextAreaField
              label="Fundamentos do pedido"
              name="texto"
              placeholder="Explique os motivos pelos quais discorda da sanção aplicada."
              required
              rows={4}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Enviando...">
                Solicitar reconsideração
              </SubmitButton>
              <ActionFeedback state={solState} />
            </div>
          </form>
        </details>
      ) : null}

      {mostrarDecidir ? (
        <details className="rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Decidir reconsideração
          </summary>
          <form action={decAction} className="mt-3 space-y-3">
            <input
              name="reconsideracaoId"
              type="hidden"
              value={reconsideracaoPendenteId}
            />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Resultado
              </span>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                name="resultado"
                onChange={(e) => setResultado(e.target.value)}
                value={resultado}
              >
                <option value="INDEFERIR">
                  Indeferir (retoma efeitos da sanção)
                </option>
                <option value="DEFERIR">Deferir</option>
              </select>
            </label>

            {resultado === "DEFERIR" ? (
              <>
                <SelectField
                  label="Nova sanção (opcional — não pode agravar)"
                  name="novoTipoSancaoCodigo"
                  options={[
                    { label: "Sem nova sanção (anula a original)", value: "" },
                    ...tiposSancao.map((t) => ({
                      label: `${t.ordem}. ${t.nome}`,
                      value: t.codigo,
                    })),
                  ]}
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Novos dias (se aplicavel)
                  </span>
                  <input
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
                    max={60}
                    min={1}
                    name="novosDias"
                    placeholder="Ex.: 5"
                    type="number"
                  />
                </label>
              </>
            ) : null}

            <TextAreaField
              label="Parecer / despacho"
              name="parecer"
              placeholder="Justifique a decisão sobre o pedido de reconsideração."
              required
              rows={4}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Registrando...">
                Registrar decisão
              </SubmitButton>
              <ActionFeedback state={decState} />
            </div>
          </form>
        </details>
      ) : null}
    </div>
  );
}
