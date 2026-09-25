"use client";

import { useActionState, useState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { TextField } from "@/components/forms/text-field";
import { idleActionState } from "@/lib/actions/action-state";
import { SeletorAlunos } from "@/modules/alunos/components/seletor-alunos";

import { createOcorrenciaAction } from "../actions/ocorrencia-actions";
import { TIPOS_OCORRENCIA } from "../constants";

const tipoOptions = [
  { label: "Disciplinar", value: "DISCIPLINAR" },
  { label: "Falta escolar", value: "FALTA_ESCOLAR" },
  { label: "Atraso escolar", value: "ATRASO_ESCOLAR" },
].filter((option) =>
  (TIPOS_OCORRENCIA as readonly string[]).includes(option.value),
);

const OUTROS = "OUTROS";

type Motivo = {
  id: string;
  codigo: string;
  descricao: string;
  natureza: string;
};

type Props = {
  series: string[];
  salasPorSerie: Record<string, string[]>;
  todasSalas: string[];
  motivos: Motivo[];
};

export function NovaOcorrenciaForm({
  series,
  salasPorSerie,
  todasSalas,
  motivos,
}: Props) {
  const [state, formAction] = useActionState(
    createOcorrenciaAction,
    idleActionState,
  );
  const [motivoSugeridoId, setMotivoSugeridoId] = useState("");
  const [descricao, setDescricao] = useState("");

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <SelectField label="Tipo" name="tipo" options={tipoOptions} required />
      <TextField
        label="Data e hora do fato"
        name="dataOcorrencia"
        required
        type="datetime-local"
      />
      <div className="md:col-span-2">
        <TextField
          label="Local"
          name="local"
          placeholder="Ex.: Pátio interno"
        />
      </div>
      <div className="md:col-span-2">
        <TextField
          label="Disciplinar (componente curricular)"
          name="materia"
          placeholder="Ex.: Língua Portuguesa"
        />
      </div>
      {motivos.length > 0 ? (
        <div className="md:col-span-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Motivo frequente
            </span>
            <select
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
              onChange={(e) => {
                const id = e.target.value;
                if (id === OUTROS || id === "") {
                  setMotivoSugeridoId("");
                  return;
                }
                const motivo = motivos.find((m) => m.id === id);
                setMotivoSugeridoId(id);
                if (motivo) setDescricao(motivo.descricao);
              }}
              value={motivoSugeridoId || OUTROS}
            >
              <option value={OUTROS}>Outros (descrever manualmente)</option>
              {motivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo} — {m.descricao}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Preenche o relato abaixo como ponto de partida (continua
              editável) e fica registrado como sugestão para quem faz o
              enquadramento.
            </span>
          </label>
        </div>
      ) : null}
      <input name="motivoSugeridoId" type="hidden" value={motivoSugeridoId} />
      <div className="md:col-span-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Descrição do fato
          </span>
          <textarea
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
            name="descricao"
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Relate o fato observado. Não é enquadramento nem sanção."
            required
            rows={5}
            value={descricao}
          />
        </label>
      </div>
      <div className="md:col-span-2">
        <SeletorAlunos
          ajuda="Vários alunos = comunicação coletiva: cada um recebe um processo individual dentro da mesma ocorrência."
          label="Alunos envolvidos"
          multiplo
          name="alunoIds"
          salasPorSerie={salasPorSerie}
          series={series}
          todasSalas={todasSalas}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
        <input
          className="h-4 w-4 rounded border-slate-300"
          name="sigiloso"
          type="checkbox"
        />
        Ocorrência sigilosa
      </label>
      <div className="space-y-2 md:col-span-2">
        <SubmitButton pendingLabel="Registrando...">
          Registrar comunicação
        </SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}
