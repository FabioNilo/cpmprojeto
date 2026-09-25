"use client";

import { useState, useTransition } from "react";

import { buscarAlunosParaSelecaoAction } from "../actions/buscar-alunos-action";
import type { AlunoOpcao } from "../queries/search-alunos";

type Props = {
  name: string; // nome do campo submetido (ex.: "alunoIds" ou "alunoId")
  multiplo?: boolean;
  series: string[];
  salasPorSerie: Record<string, string[]>;
  todasSalas: string[];
  label?: string;
  ajuda?: string;
};

export function SeletorAlunos({
  name,
  multiplo = false,
  series,
  salasPorSerie,
  todasSalas,
  label = "Alunos",
  ajuda,
}: Props) {
  const [serie, setSerie] = useState("");
  const [sala, setSala] = useState("");
  const [termo, setTermo] = useState("");
  const [opcoes, setOpcoes] = useState<AlunoOpcao[]>([]);
  const [selecionados, setSelecionados] = useState<AlunoOpcao[]>([]);
  const [carregou, setCarregou] = useState(false);
  const [pendente, iniciar] = useTransition();

  const salas = serie ? (salasPorSerie[serie] ?? []) : todasSalas;

  const buscar = () => {
    iniciar(async () => {
      const resultado = await buscarAlunosParaSelecaoAction({
        serie: serie || undefined,
        sala: sala || undefined,
        termo: termo || undefined,
      });
      setOpcoes(resultado);
      setCarregou(true);
    });
  };

  const alternar = (aluno: AlunoOpcao) => {
    setSelecionados((atual) => {
      const existe = atual.some((a) => a.id === aluno.id);
      if (multiplo) {
        return existe
          ? atual.filter((a) => a.id !== aluno.id)
          : [...atual, aluno];
      }
      return existe ? [] : [aluno];
    });
  };

  const idsSelecionados = new Set(selecionados.map((a) => a.id));

  return (
    <div className="space-y-3">
      <span className="block text-sm font-medium text-slate-700">{label}</span>

      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:flex sm:flex-wrap sm:items-end">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Turma
          </span>
          <select
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-2 text-sm sm:h-9"
            onChange={(e) => {
              setSerie(e.target.value);
              setSala("");
            }}
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
            className="h-11 w-full rounded-md border border-slate-300 bg-white px-2 text-sm sm:h-9"
            onChange={(e) => setSala(e.target.value)}
            value={sala}
          >
            <option value="">Todas</option>
            {salas.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 block sm:flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-500">
            Nome ou matrícula
          </span>
          <input
            className="h-11 w-full rounded-md border border-slate-300 px-2 text-sm sm:h-9 sm:min-w-40"
            onChange={(e) => setTermo(e.target.value)}
            placeholder="opcional"
            type="search"
            value={termo}
          />
        </label>
        <button
          className="col-span-2 h-11 rounded-md bg-navy-900 px-3 text-sm font-semibold text-white disabled:bg-slate-400 sm:col-span-1 sm:h-9"
          disabled={pendente}
          onClick={buscar}
          type="button"
        >
          {pendente ? "Buscando..." : "Buscar alunos"}
        </button>
      </div>

      {selecionados.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selecionados.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-full bg-navy-900 px-3 py-1 text-xs font-medium text-white"
            >
              {a.nome}
              <button
                aria-label={`Remover ${a.nome}`}
                className="text-white/80 hover:text-white"
                onClick={() => alternar(a)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {carregou ? (
        opcoes.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum aluno para esse filtro.
          </p>
        ) : (
          <ul className="max-h-72 space-y-1 overflow-auto rounded-md border border-slate-200 p-2">
            {opcoes.map((a) => (
              <li key={a.id}>
                <label className="flex items-center gap-3 rounded px-2 py-2.5 text-sm hover:bg-slate-50 sm:py-1.5">
                  <input
                    checked={idsSelecionados.has(a.id)}
                    className="h-4 w-4 shrink-0"
                    onChange={() => alternar(a)}
                    type={multiplo ? "checkbox" : "radio"}
                  />
                  <span className="min-w-0">
                    <span className="font-medium text-slate-800">{a.nome}</span>
                    {a.turma ? (
                      <span className="block text-xs text-slate-500">
                        {a.turma}
                        {a.matriculaGeral ? ` · ${a.matriculaGeral}` : ""}
                      </span>
                    ) : a.matriculaGeral ? (
                      <span className="block text-xs text-slate-500">
                        {a.matriculaGeral}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )
      ) : (
        <p className="text-xs text-slate-500">
          Selecione a turma/sala e clique em “Buscar alunos”.
        </p>
      )}

      {selecionados.map((a) => (
        <input key={a.id} name={name} type="hidden" value={a.id} />
      ))}

      {ajuda ? <p className="text-xs text-slate-500">{ajuda}</p> : null}
    </div>
  );
}
