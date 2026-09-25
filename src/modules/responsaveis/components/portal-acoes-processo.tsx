"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";
import {
  confirmarCienciaAction,
  registrarManifestacaoAction,
} from "@/modules/disciplina/actions/manifestacao-actions";
import { solicitarReconsideracaoAction } from "@/modules/disciplina/actions/reconsideracao-actions";

type Props = {
  ocorrenciaAlunoId: string;
  podeManifestar: boolean;
  podeConfirmarCiencia: boolean;
  sancaoRecursoId: string | null;
};

const TIPOS = [
  { value: "JUSTIFICACAO", label: "Justificação" },
  { value: "DEFESA", label: "Defesa" },
  { value: "ESCLARECIMENTO", label: "Esclarecimento" },
  { value: "COMPLEMENTACAO", label: "Complementação" },
];

export function PortalAcoesProcesso({
  ocorrenciaAlunoId,
  podeManifestar,
  podeConfirmarCiencia,
  sancaoRecursoId,
}: Props) {
  const [manifState, manifAction] = useActionState(
    registrarManifestacaoAction,
    idleActionState,
  );
  const [cienciaState, cienciaAction] = useActionState(
    confirmarCienciaAction,
    idleActionState,
  );
  const [recursoState, recursoAction] = useActionState(
    solicitarReconsideracaoAction,
    idleActionState,
  );

  if (!podeManifestar && !podeConfirmarCiencia && !sancaoRecursoId) {
    return null;
  }

  return (
    <div className="space-y-3">
      {podeManifestar ? (
        <details className="rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Apresentar manifestação / justificativa
          </summary>
          <form action={manifAction} className="mt-3 space-y-3">
            <input
              name="ocorrenciaAlunoId"
              type="hidden"
              value={ocorrenciaAlunoId}
            />
            <SelectField label="Tipo" name="tipo" options={TIPOS} required />
            <TextAreaField
              label="Texto"
              name="texto"
              placeholder="Descreva sua justificativa ou defesa. Uma vez enviada, não pode ser alterada; para complementar, envie um novo registro."
              required
              rows={5}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Enviando...">Enviar</SubmitButton>
              <ActionFeedback state={manifState} />
            </div>
          </form>
        </details>
      ) : null}

      {podeConfirmarCiencia ? (
        <form
          action={cienciaAction}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <input
            name="ocorrenciaAlunoId"
            type="hidden"
            value={ocorrenciaAlunoId}
          />
          <input name="meio" type="hidden" value="PORTAL" />
          <p className="mb-2 text-sm text-slate-700">
            Confirmar que tomei ciência desta comunicação. Isso não significa
            concordância — o direito de manifestação continua garantido.
          </p>
          <TextAreaField
            label="Observação (opcional)"
            name="observacao"
            placeholder="Ex.: Já conversei com meu filho(a) sobre o ocorrido."
            rows={2}
          />
          <div className="mt-2 space-y-2">
            <SubmitButton pendingLabel="Registrando...">
              Confirmar ciência
            </SubmitButton>
            <ActionFeedback state={cienciaState} />
          </div>
        </form>
      ) : null}

      {sancaoRecursoId ? (
        <details className="rounded-lg border border-slate-200 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Solicitar reconsideração da sanção
          </summary>
          <form action={recursoAction} className="mt-3 space-y-3">
            <input name="sancaoId" type="hidden" value={sancaoRecursoId} />
            <TextAreaField
              label="Fundamentos do pedido"
              name="texto"
              placeholder="Explique os motivos pelos quais discorda da sanção aplicada."
              required
              rows={5}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Enviando...">
                Solicitar reconsideração
              </SubmitButton>
              <ActionFeedback state={recursoState} />
            </div>
          </form>
        </details>
      ) : null}
    </div>
  );
}
