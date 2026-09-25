"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import {
  anularSancaoAction,
  aplicarSancaoAction,
  registrarCumprimentoSancaoAction,
  retomarEfeitosSancaoAction,
  suspenderEfeitosSancaoAction,
} from "../actions/sancao-actions";

type SancaoAcoesProps = {
  ocorrenciaAlunoId: string;
  decisaoId: string | null;
  sancaoId: string | null;
  sancaoStatus: "ATIVA" | "SUSPENSA" | "ANULADA" | "CUMPRIDA" | null;
  podeAplicar: boolean;
  alunoNecessidadeEspecial: boolean;
};

export function SancaoAcoes({
  ocorrenciaAlunoId,
  decisaoId,
  sancaoId,
  sancaoStatus,
  podeAplicar,
  alunoNecessidadeEspecial,
}: SancaoAcoesProps) {
  const [aplicarState, aplicarAction] = useActionState(
    aplicarSancaoAction,
    idleActionState,
  );
  const [cumprirState, cumprirAction] = useActionState(
    registrarCumprimentoSancaoAction,
    idleActionState,
  );
  const [anularState, anularAction] = useActionState(
    anularSancaoAction,
    idleActionState,
  );
  const [suspState, suspAction] = useActionState(
    suspenderEfeitosSancaoAction,
    idleActionState,
  );
  const [retomarState, retomarAction] = useActionState(
    retomarEfeitosSancaoAction,
    idleActionState,
  );

  if (!podeAplicar) {
    return null;
  }

  if (!sancaoId) {
    if (!decisaoId) {
      return null;
    }
    return (
      <form action={aplicarAction} className="mt-3 space-y-2">
        <input name="ocorrenciaAlunoId" type="hidden" value={ocorrenciaAlunoId} />
        <input name="decisaoId" type="hidden" value={decisaoId} />
        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
          name="observacao"
          placeholder="Observação (opcional)"
          type="text"
        />
        {alunoNecessidadeEspecial ? (
          <div>
            <label
              className="mb-1 block text-xs font-medium text-slate-600"
              htmlFor="impactoPontosManual"
            >
              Impacto em pontos (aluno com necessidade especial — informe
              manualmente, em vez do valor padrão do catálogo)
            </label>
            <input
              className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm"
              id="impactoPontosManual"
              max={0}
              min={-10}
              name="impactoPontosManual"
              placeholder="Ex.: -0,25 (deixe em branco para usar o valor do catálogo)"
              step="0.01"
              type="number"
            />
          </div>
        ) : null}
        <SubmitButton pendingLabel="Aplicando...">
          Aplicar sanção da decisão
        </SubmitButton>
        <ActionFeedback state={aplicarState} />
      </form>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {sancaoStatus === "ATIVA" ? (
        <>
          <form action={cumprirAction} className="space-y-1">
            <input
              name="ocorrenciaAlunoId"
              type="hidden"
              value={ocorrenciaAlunoId}
            />
            <input name="sancaoId" type="hidden" value={sancaoId} />
            <input
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              name="motivo"
              placeholder="Observação do cumprimento (opcional)"
              type="text"
            />
            <SubmitButton pendingLabel="Registrando..." variant="secondary">
              Registrar cumprimento
            </SubmitButton>
            <ActionFeedback state={cumprirState} />
          </form>

          <form action={suspAction} className="space-y-1">
            <input
              name="ocorrenciaAlunoId"
              type="hidden"
              value={ocorrenciaAlunoId}
            />
            <input name="sancaoId" type="hidden" value={sancaoId} />
            <input
              className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
              name="motivo"
              placeholder="Motivo da suspensão dos efeitos"
              type="text"
            />
            <SubmitButton pendingLabel="Suspendendo..." variant="secondary">
              Suspender efeitos
            </SubmitButton>
            <ActionFeedback state={suspState} />
          </form>
        </>
      ) : null}

      {sancaoStatus === "SUSPENSA" ? (
        <form action={retomarAction} className="space-y-1">
          <input
            name="ocorrenciaAlunoId"
            type="hidden"
            value={ocorrenciaAlunoId}
          />
          <input name="sancaoId" type="hidden" value={sancaoId} />
          <input
            className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            name="motivo"
            placeholder="Motivo da retomada dos efeitos"
            type="text"
          />
          <SubmitButton pendingLabel="Retomando..." variant="secondary">
            Retomar efeitos
          </SubmitButton>
          <ActionFeedback state={retomarState} />
        </form>
      ) : null}

      {sancaoStatus !== "ANULADA" ? (
        <form action={anularAction} className="space-y-1">
          <input
            name="ocorrenciaAlunoId"
            type="hidden"
            value={ocorrenciaAlunoId}
          />
          <input name="sancaoId" type="hidden" value={sancaoId} />
          <input
            className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm"
            name="motivo"
            placeholder="Motivo da anulação"
            type="text"
          />
          <SubmitButton pendingLabel="Anulando..." variant="danger">
            Anular sanção
          </SubmitButton>
          <ActionFeedback state={anularState} />
        </form>
      ) : null}
    </div>
  );
}
