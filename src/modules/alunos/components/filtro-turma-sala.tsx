"use client";

import { useState } from "react";

type Props = {
  series: string[];
  salasPorSerie: Record<string, string[]>;
  todasSalas: string[];
  defaults?: { serie?: string; sala?: string; termo?: string };
  // Campos ocultos extras a preservar (ex.: faixa no painel de comportamento).
  ocultos?: Record<string, string>;
  compacto?: boolean;
};

export function FiltroTurmaSala({
  series,
  salasPorSerie,
  todasSalas,
  defaults,
  ocultos,
  compacto,
}: Props) {
  const [serie, setSerie] = useState(defaults?.serie ?? "");
  const salas = serie ? (salasPorSerie[serie] ?? []) : todasSalas;

  return (
    <form
      className={`flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 ${
        compacto ? "" : "mb-4"
      }`}
      method="get"
    >
      {Object.entries(ocultos ?? {}).map(([k, v]) => (
        <input key={k} name={k} type="hidden" value={v} />
      ))}
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Turma
        </span>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          name="serie"
          onChange={(e) => setSerie(e.target.value)}
          value={serie}
        >
          <option value="">Todas</option>
          {series.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Sala
        </span>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          defaultValue={defaults?.sala ?? ""}
          name="sala"
        >
          <option value="">Todas</option>
          {salas.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block flex-1">
        <span className="mb-1 block text-xs font-medium text-slate-500">
          Nome ou matrícula
        </span>
        <input
          className="h-10 w-full min-w-48 rounded-md border border-slate-300 px-3 text-sm"
          defaultValue={defaults?.termo ?? ""}
          name="q"
          placeholder="Digite parte do nome..."
          type="search"
        />
      </label>

      <button
        className="h-10 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white"
        type="submit"
      >
        Buscar
      </button>
    </form>
  );
}
