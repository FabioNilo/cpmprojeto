"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import {
  enviarAnexoAction,
  removerAnexoAction,
} from "../actions/anexo-actions";
import { CATEGORIAS_ANEXO } from "../schemas/anexo-schemas";

type AnexoItem = {
  id: string;
  categoria: string;
  origem: string;
  nomeArquivo: string;
  tamanhoBytes: number;
  ocorrenciaAlunoId: string | null;
  createdAt: Date | string;
  enviadoPor: { nome: string };
};

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnexosPanel({
  ocorrenciaId,
  anexos,
  podeGerir,
  storageConfigurado,
  processos,
}: {
  ocorrenciaId: string;
  anexos: AnexoItem[];
  podeGerir: boolean;
  storageConfigurado: boolean;
  processos: Array<{ id: string; label: string }>;
}) {
  const [envState, envAction] = useActionState(
    enviarAnexoAction,
    idleActionState,
  );
  const [remState, remAction] = useActionState(
    removerAnexoAction,
    idleActionState,
  );

  return (
    <div className="space-y-3">
      {anexos.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum anexo.</p>
      ) : (
        <ul className="space-y-2">
          {anexos.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 p-3"
            >
              <div>
                <a
                  className="text-sm font-medium text-navy-900 hover:underline"
                  href={`/disciplina/anexos/${a.id}`}
                  rel="noreferrer"
                  target="_blank"
                >
                  {a.nomeArquivo}
                </a>
                <p className="text-xs text-slate-500">
                  {a.categoria} · {a.origem} · {formatarTamanho(a.tamanhoBytes)} ·{" "}
                  {a.enviadoPor.nome}
                </p>
              </div>
              {podeGerir ? (
                <form action={remAction}>
                  <input name="anexoId" type="hidden" value={a.id} />
                  <button
                    className="text-xs font-semibold text-red-700 hover:underline"
                    type="submit"
                  >
                    Remover
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <ActionFeedback state={remState} />

      {podeGerir ? (
        storageConfigurado ? (
          <details className="rounded-md border border-slate-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-semibold text-navy-900">
              Enviar anexo
            </summary>
            <form action={envAction} className="mt-3 space-y-3">
              <input name="ocorrenciaId" type="hidden" value={ocorrenciaId} />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">
                  Categoria
                </span>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  name="categoria"
                >
                  {CATEGORIAS_ANEXO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              {processos.length > 0 ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">
                    Vincular a um processo (opcional)
                  </span>
                  <select
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                    name="ocorrenciaAlunoId"
                  >
                    <option value="">Ocorrência (geral)</option>
                    {processos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <input
                className="block w-full text-sm"
                name="arquivo"
                type="file"
              />
              <p className="text-xs text-slate-500">
                Até 10 MB. PDF, imagens, txt ou Word.
              </p>
              <div className="space-y-2">
                <SubmitButton pendingLabel="Enviando...">Enviar</SubmitButton>
                <ActionFeedback state={envState} />
              </div>
            </form>
          </details>
        ) : (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Object storage não configurado: defina SUPABASE_URL e
            SUPABASE_SERVICE_ROLE_KEY no .env para habilitar upload.
          </p>
        )
      ) : null}
    </div>
  );
}
