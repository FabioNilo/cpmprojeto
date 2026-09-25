"use client";

import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextAreaField } from "@/components/forms/textarea-field";
import { idleActionState } from "@/lib/actions/action-state";

import {
  registrarDecisaoAction,
  registrarEnquadramentoAction,
  revogarDecisaoAction,
  revogarEnquadramentoAction,
} from "../actions/decisao-actions";
import { RESULTADOS_DECISAO } from "../constants";

type Opcao = { id: string; codigo: string; descricao: string };
type OpcaoTransgressao = Opcao & { natureza: string };
type OpcaoSancao = { codigo: string; nome: string; ordem: number };

type Enquadramento = {
  id: string;
  natureza: string;
  fundamentacao: string | null;
  createdAt: Date | string;
  transgressao: { codigo: string; descricao: string; natureza: string };
  registradoPor: { nome: string };
};

type Decisao = {
  id: string;
  resultado: string;
  naturezaApurada: string | null;
  sancaoTipoCodigo: string | null;
  diasSancao: number | null;
  fundamentacao: string;
  numero: string | null;
  createdAt: Date | string;
  decididoPor: { nome: string };
  decididoPorPerfilCodigo: string;
  atenuantes: Array<{ atenuante: { codigo: string; descricao: string } }>;
  agravantes: Array<{ agravante: { codigo: string; descricao: string } }>;
};

type MotivoSugerido = {
  id: string;
  codigo: string;
  descricao: string;
  natureza: string;
} | null;

type AnaliseProcessoProps = {
  ocorrenciaAlunoId: string;
  podeEnquadrar: boolean;
  podeDecidir: boolean;
  enquadramentos: Enquadramento[];
  decisao: Decisao | null;
  motivoSugerido?: MotivoSugerido;
  opcoes: {
    transgressoes: OpcaoTransgressao[];
    atenuantes: Opcao[];
    agravantes: Opcao[];
    tiposSancao: OpcaoSancao[];
  };
};

function formatarData(valor: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

const RESULTADO_LABEL: Record<string, string> = {
  PROCEDENTE: "Procedente (segue para sanção)",
  IMPROCEDENTE: "Improcedente",
  ARQUIVADO: "Arquivado sem sanção",
  ENCAMINHADO_SINDICANCIA: "Encaminhar para sindicância",
};

export function AnaliseProcesso({
  ocorrenciaAlunoId,
  podeEnquadrar,
  podeDecidir,
  enquadramentos,
  decisao,
  motivoSugerido,
  opcoes,
}: AnaliseProcessoProps) {
  const [enqState, enqAction] = useActionState(
    registrarEnquadramentoAction,
    idleActionState,
  );
  const [revEnqState, revEnqAction] = useActionState(
    revogarEnquadramentoAction,
    idleActionState,
  );
  const [decState, decAction] = useActionState(
    registrarDecisaoAction,
    idleActionState,
  );
  const [revDecState, revDecAction] = useActionState(
    revogarDecisaoAction,
    idleActionState,
  );
  const [resultado, setResultado] = useState("PROCEDENTE");

  const nada =
    !podeEnquadrar && !podeDecidir && enquadramentos.length === 0 && !decisao;
  if (nada) {
    return null;
  }

  return (
    <div className="mt-4 border-t border-slate-200 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Análise e decisão
      </p>

      <div className="mt-2 space-y-1">
        <p className="text-sm font-medium text-slate-700">
          Enquadramentos ({enquadramentos.length})
        </p>
        {enquadramentos.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum enquadramento registrado.
          </p>
        ) : (
          <ul className="space-y-2">
            {enquadramentos.map((e) => (
              <li
                key={e.id}
                className="rounded-md border border-slate-100 bg-slate-50 p-3"
              >
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">{e.transgressao.codigo}</span>{" "}
                  ({e.natureza}) — {e.transgressao.descricao}
                </p>
                <p className="text-xs text-slate-500">
                  {formatarData(e.createdAt)} · por {e.registradoPor.nome}
                </p>
                {e.fundamentacao ? (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                    {e.fundamentacao}
                  </p>
                ) : null}
                {podeEnquadrar && !decisao ? (
                  <form action={revEnqAction} className="mt-2">
                    <input
                      name="ocorrenciaAlunoId"
                      type="hidden"
                      value={ocorrenciaAlunoId}
                    />
                    <input name="enquadramentoId" type="hidden" value={e.id} />
                    <button
                      className="text-xs font-semibold text-red-700 hover:underline"
                      type="submit"
                    >
                      Revogar enquadramento
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <ActionFeedback state={revEnqState} />
      </div>

      {podeEnquadrar && !decisao ? (
        <details className="mt-2 rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Adicionar enquadramento
          </summary>
          <form action={enqAction} className="mt-3 space-y-3">
            <input
              name="ocorrenciaAlunoId"
              type="hidden"
              value={ocorrenciaAlunoId}
            />
            {motivoSugerido ? (
              <p className="text-xs text-slate-500">
                Sugestão do comunicante:{" "}
                <span className="font-semibold text-slate-700">
                  {motivoSugerido.codigo} — {motivoSugerido.descricao}
                </span>{" "}
                (confirme ou escolha outra abaixo)
              </p>
            ) : null}
            <SelectField
              defaultValue={motivoSugerido?.id}
              label="Transgressão"
              name="transgressaoId"
              options={opcoes.transgressoes.map((t) => ({
                label: `${t.codigo} (${t.natureza}) — ${t.descricao}`,
                value: t.id,
              }))}
              required
            />
            <TextAreaField
              label="Fundamentação (opcional)"
              name="fundamentacao"
              placeholder="Ex.: Enquadramento baseado no relato e nas evidências apresentadas."
              rows={3}
            />
            <div className="space-y-2">
              <SubmitButton pendingLabel="Registrando...">
                Registrar enquadramento
              </SubmitButton>
              <ActionFeedback state={enqState} />
            </div>
          </form>
        </details>
      ) : null}

      {decisao ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
          <p className="text-sm font-semibold text-slate-900">
            Decisão {decisao.numero ? `${decisao.numero} · ` : ""}
            {RESULTADO_LABEL[decisao.resultado] ?? decisao.resultado}
          </p>
          <p className="text-xs text-slate-500">
            {formatarData(decisao.createdAt)} · por {decisao.decididoPor.nome} (
            {decisao.decididoPorPerfilCodigo})
          </p>
          {decisao.naturezaApurada ? (
            <p className="mt-1 text-sm text-slate-700">
              Natureza apurada: {decisao.naturezaApurada}
            </p>
          ) : null}
          {decisao.sancaoTipoCodigo ? (
            <p className="text-sm text-slate-700">
              Sanção prevista: {decisao.sancaoTipoCodigo}
              {decisao.diasSancao ? ` (${decisao.diasSancao} dias)` : ""}
            </p>
          ) : null}
          {decisao.atenuantes.length > 0 ? (
            <p className="mt-1 text-xs text-slate-600">
              Atenuantes:{" "}
              {decisao.atenuantes.map((a) => a.atenuante.codigo).join(", ")}
            </p>
          ) : null}
          {decisao.agravantes.length > 0 ? (
            <p className="text-xs text-slate-600">
              Agravantes:{" "}
              {decisao.agravantes.map((a) => a.agravante.codigo).join(", ")}
            </p>
          ) : null}
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
            {decisao.fundamentacao}
          </p>
          {podeDecidir ? (
            <form action={revDecAction} className="mt-2">
              <input
                name="ocorrenciaAlunoId"
                type="hidden"
                value={ocorrenciaAlunoId}
              />
              <input name="decisaoId" type="hidden" value={decisao.id} />
              <button
                className="text-xs font-semibold text-red-700 hover:underline"
                type="submit"
              >
                Revogar decisão
              </button>
              <ActionFeedback state={revDecState} />
            </form>
          ) : null}
        </div>
      ) : podeDecidir ? (
        <details className="mt-2 rounded-md border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-navy-900">
            Registrar decisão
          </summary>
          <form action={decAction} className="mt-3 space-y-3">
            <input
              name="ocorrenciaAlunoId"
              type="hidden"
              value={ocorrenciaAlunoId}
            />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Resultado
              </span>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                name="resultado"
                onChange={(event) => setResultado(event.target.value)}
                value={resultado}
              >
                {RESULTADOS_DECISAO.map((r) => (
                  <option key={r} value={r}>
                    {RESULTADO_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>

            {resultado === "PROCEDENTE" ? (
              <>
                <SelectField
                  label="Tipo de sanção (competência validada no servidor)"
                  name="sancaoTipoCodigo"
                  options={opcoes.tiposSancao.map((s) => ({
                    label: `${s.ordem}. ${s.nome}`,
                    value: s.codigo,
                  }))}
                  required
                />
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Dias de suspensão (se aplicável)
                  </span>
                  <input
                    className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
                    max={60}
                    min={1}
                    name="diasSancao"
                    type="number"
                  />
                </label>
              </>
            ) : null}

            <fieldset className="rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-xs font-semibold uppercase text-slate-500">
                Atenuantes
              </legend>
              <div className="space-y-1">
                {opcoes.atenuantes.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <input
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      name="atenuanteIds"
                      type="checkbox"
                      value={a.id}
                    />
                    {a.descricao}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-md border border-slate-200 p-3">
              <legend className="px-1 text-xs font-semibold uppercase text-slate-500">
                Agravantes
              </legend>
              <div className="space-y-1">
                {opcoes.agravantes.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-start gap-2 text-sm text-slate-700"
                  >
                    <input
                      className="mt-0.5 h-4 w-4 rounded border-slate-300"
                      name="agravanteIds"
                      type="checkbox"
                      value={a.id}
                    />
                    {a.descricao}
                  </label>
                ))}
              </div>
            </fieldset>

            <TextAreaField
              label="Fundamentação da decisão"
              name="fundamentacao"
              placeholder="Justifique a decisão com base nos enquadramentos e evidências."
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
