"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";

import {
  avaliarManifestacaoAction,
  confirmarCienciaAction,
  registrarManifestacaoAction,
} from "../actions/manifestacao-actions";
import { MEIOS_CIENCIA, TIPOS_MANIFESTACAO } from "../constants";

type ProcessoAcoesProps = {
  ocorrenciaAlunoId: string;
  podeManifestar: boolean;
  podeConfirmarCiencia: boolean;
  podeAvaliar: boolean;
};

const tipoOptions = TIPOS_MANIFESTACAO.map((v) => ({ label: v, value: v }));
const meioOptions = MEIOS_CIENCIA.map((v) => ({ label: v, value: v }));

export function ProcessoAcoes({
  ocorrenciaAlunoId,
  podeManifestar,
  podeConfirmarCiencia,
  podeAvaliar,
}: ProcessoAcoesProps) {
  const [manifState, manifAction] = useActionState(
    registrarManifestacaoAction,
    idleActionState,
  );
  const [cienciaState, cienciaAction] = useActionState(
    confirmarCienciaAction,
    idleActionState,
  );
  const [avalState, avalAction] = useActionState(
    avaliarManifestacaoAction,
    idleActionState,
  );

  if (!podeManifestar && !podeConfirmarCiencia && !podeAvaliar) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {podeManifestar ? (
        <details className="rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Registrar manifestação
          </summary>
          <form action={manifAction} className="mt-3 space-y-3">
            <input name="ocorrenciaAlunoId" type="hidden" value={ocorrenciaAlunoId} />
            <SelectField
              label="Tipo"
              name="tipo"
              options={tipoOptions}
              required
            />
            <TextAreaField
              label="Texto da manifestação"
              name="texto"
              placeholder="Manifestações já registradas não podem ser alteradas; complementar gera novo registro."
              required
              rows={4}
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                className="h-4 w-4 rounded border-slate-300"
                name="viaPresencial"
                type="checkbox"
              />
              Registrada presencialmente (em nome do responsável)
            </label>
            <div className="space-y-2">
              <SubmitButton pendingLabel="Registrando...">
                Registrar
              </SubmitButton>
              <ActionFeedback state={manifState} />
            </div>
          </form>
        </details>
      ) : null}

      {podeConfirmarCiencia ? (
        <details className="rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Confirmar ciência
          </summary>
          <form action={cienciaAction} className="mt-3 space-y-3">
            <input name="ocorrenciaAlunoId" type="hidden" value={ocorrenciaAlunoId} />
            <SelectField
              label="Meio"
              name="meio"
              options={meioOptions}
              required
            />
            <TextAreaField
              label="Observação"
              name="observacao"
              placeholder="Ex.: Ciência dada pessoalmente ao responsável."
              rows={2}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Registrando...">
                Confirmar ciência
              </SubmitButton>
              <ActionFeedback state={cienciaState} />
            </div>
          </form>
        </details>
      ) : null}

      {podeAvaliar ? (
        <details className="rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Avaliar manifestação (acolher / indeferir)
          </summary>
          <form action={avalAction} className="mt-3 space-y-3">
            <input name="ocorrenciaAlunoId" type="hidden" value={ocorrenciaAlunoId} />
            <SelectField
              label="Resultado"
              name="resultado"
              options={[
                { label: "Acolher (processo JUSTIFICADO, sem sanção)", value: "ACOLHER" },
                { label: "Indeferir (segue para análise)", value: "INDEFERIR" },
              ]}
              required
            />
            <TextAreaField
              label="Parecer"
              name="parecer"
              placeholder="Justifique a decisão sobre a manifestação apresentada."
              required
              rows={3}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Registrando...">
                Registrar avaliação
              </SubmitButton>
              <ActionFeedback state={avalState} />
            </div>
          </form>
        </details>
      ) : null}
    </div>
  );
}
