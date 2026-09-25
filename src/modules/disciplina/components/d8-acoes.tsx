"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";

import {
  atualizarSindicanciaAction,
  determinarAfastamentoAction,
  encerrarAfastamentoAction,
  instaurarConselhoAction,
  instaurarSindicanciaAction,
  prorrogarAfastamentoAction,
  registrarParecerConselhoAction,
} from "../actions/d8-actions";

function Campo({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      <input
        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function SindicanciaAcoes({
  ocorrenciaId,
  podeGerir,
  sindicanciasAtivas,
}: {
  ocorrenciaId: string;
  podeGerir: boolean;
  sindicanciasAtivas: Array<{ id: string; status: string }>;
}) {
  const [instState, instAction] = useActionState(
    instaurarSindicanciaAction,
    idleActionState,
  );
  const [attState, attAction] = useActionState(
    atualizarSindicanciaAction,
    idleActionState,
  );

  if (!podeGerir) {
    return null;
  }

  const emAberto = sindicanciasAtivas.filter(
    (s) => s.status === "INSTAURADA" || s.status === "EM_ANDAMENTO",
  );

  return (
    <div className="space-y-2">
      <details className="rounded-md border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-navy-900">
          Instaurar sindicância
        </summary>
        <form action={instAction} className="mt-3 space-y-3">
          <input name="ocorrenciaId" type="hidden" value={ocorrenciaId} />
          <TextAreaField
            label="Objeto"
            name="objeto"
            placeholder="Descreva o objeto a ser apurado na sindicância."
            required
            rows={3}
          />
          <div className="space-y-2">
            <SubmitButton pendingLabel="Instaurando...">Instaurar</SubmitButton>
            <ActionFeedback state={instState} />
          </div>
        </form>
      </details>

      {emAberto.map((s) => (
        <form
          key={s.id}
          action={attAction}
          className="space-y-2 rounded-md border border-slate-200 bg-white p-3"
        >
          <input name="sindicanciaId" type="hidden" value={s.id} />
          <p className="text-xs text-slate-500">Sindicância · {s.status}</p>
          <TextAreaField
            label="Conclusão / parecer (obrigatório ao concluir/arquivar)"
            name="conclusao"
            placeholder="Descreva a conclusão da sindicância."
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            {s.status === "INSTAURADA" ? (
              <button
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                name="acao"
                type="submit"
                value="ANDAMENTO"
              >
                Marcar em andamento
              </button>
            ) : null}
            <button
              className="h-9 rounded-md bg-navy-900 px-3 text-sm font-semibold text-white"
              name="acao"
              type="submit"
              value="CONCLUIR"
            >
              Concluir
            </button>
            <button
              className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
              name="acao"
              type="submit"
              value="ARQUIVAR"
            >
              Arquivar
            </button>
          </div>
          <ActionFeedback state={attState} />
        </form>
      ))}
    </div>
  );
}

export function AfastamentoAcoes({
  ocorrenciaAlunoId,
  podeGerir,
  afastamentoAtivoId,
  afastamentoAtivoStatus,
}: {
  ocorrenciaAlunoId: string;
  podeGerir: boolean;
  afastamentoAtivoId: string | null;
  afastamentoAtivoStatus: string | null;
}) {
  const [detState, detAction] = useActionState(
    determinarAfastamentoAction,
    idleActionState,
  );
  const [proState, proAction] = useActionState(
    prorrogarAfastamentoAction,
    idleActionState,
  );
  const [encState, encAction] = useActionState(
    encerrarAfastamentoAction,
    idleActionState,
  );

  if (!podeGerir) {
    return null;
  }

  const ativo =
    afastamentoAtivoStatus === "ATIVO" ||
    afastamentoAtivoStatus === "PRORROGADO";

  if (!afastamentoAtivoId || !ativo) {
    return (
      <details className="rounded-md border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-navy-900">
          Determinar afastamento cautelar (não é sanção)
        </summary>
        <form action={detAction} className="mt-3 space-y-3">
          <input
            name="ocorrenciaAlunoId"
            type="hidden"
            value={ocorrenciaAlunoId}
          />
          <Campo label="Início" name="inicioEm" type="date" />
          <Campo
            label="Dias iniciais (1 a 5)"
            name="diasIniciais"
            placeholder="Ex.: 5"
            type="number"
          />
          <TextAreaField
            label="Justificativa"
            name="justificativa"
            placeholder="Justifique o afastamento cautelar."
            required
            rows={3}
          />
          <div className="space-y-2">
            <SubmitButton pendingLabel="Registrando...">
              Determinar afastamento
            </SubmitButton>
            <ActionFeedback state={detState} />
          </div>
        </form>
      </details>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-white p-3">
      {afastamentoAtivoStatus === "ATIVO" ? (
        <form action={proAction}>
          <input name="afastamentoId" type="hidden" value={afastamentoAtivoId} />
          <SubmitButton pendingLabel="Prorrogando..." variant="secondary">
            Prorrogar (uma única vez, igual período)
          </SubmitButton>
          <ActionFeedback state={proState} />
        </form>
      ) : null}
      <form action={encAction} className="space-y-2">
        <input name="afastamentoId" type="hidden" value={afastamentoAtivoId} />
        <Campo
          label="Motivo do encerramento"
          name="motivo"
          placeholder="Ex.: Concluída a apuração dos fatos"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="revogar" type="checkbox" /> Revogar (em vez de encerrar)
        </label>
        <SubmitButton pendingLabel="Encerrando..." variant="secondary">
          Encerrar afastamento
        </SubmitButton>
        <ActionFeedback state={encState} />
      </form>
    </div>
  );
}

export function ConselhoAcoes({
  ocorrenciaAlunoId,
  podeGerir,
  conselhoAbertoId,
}: {
  ocorrenciaAlunoId: string;
  podeGerir: boolean;
  conselhoAbertoId: string | null;
}) {
  const [instState, instAction] = useActionState(
    instaurarConselhoAction,
    idleActionState,
  );
  const [parState, parAction] = useActionState(
    registrarParecerConselhoAction,
    idleActionState,
  );

  if (!podeGerir) {
    return null;
  }

  if (!conselhoAbertoId) {
    return (
      <details className="rounded-md border border-slate-200 bg-white p-3">
        <summary className="cursor-pointer text-sm font-semibold text-navy-900">
          Instaurar conselho disciplinar
        </summary>
        <form action={instAction} className="mt-3 space-y-3">
          <input
            name="ocorrenciaAlunoId"
            type="hidden"
            value={ocorrenciaAlunoId}
          />
          <TextAreaField
            label="Objeto"
            name="objeto"
            placeholder="Descreva o objeto a ser apreciado pelo conselho disciplinar."
            required
            rows={3}
          />
          <div className="space-y-2">
            <SubmitButton pendingLabel="Instaurando...">Instaurar</SubmitButton>
            <ActionFeedback state={instState} />
          </div>
        </form>
      </details>
    );
  }

  return (
    <form
      action={parAction}
      className="space-y-3 rounded-md border border-slate-200 bg-white p-3"
    >
      <input name="conselhoId" type="hidden" value={conselhoAbertoId} />
      <p className="text-sm font-semibold text-navy-900">Registrar parecer</p>
      <TextAreaField
        label="Parecer"
        name="parecer"
        placeholder="Registre o parecer final do conselho disciplinar."
        required
        rows={3}
      />
      <Campo
        label="Recomendação"
        name="recomendacao"
        placeholder="Ex.: Manter a matrícula com acompanhamento"
      />
      <div className="flex gap-3">
        <Campo
          label="Votos a favor"
          name="votosFavor"
          placeholder="Ex.: 3"
          type="number"
        />
        <Campo
          label="Votos contra"
          name="votosContra"
          placeholder="Ex.: 0"
          type="number"
        />
      </div>
      <div className="space-y-2">
        <SubmitButton pendingLabel="Registrando...">
          Concluir conselho
        </SubmitButton>
        <ActionFeedback state={parState} />
      </div>
    </form>
  );
}
