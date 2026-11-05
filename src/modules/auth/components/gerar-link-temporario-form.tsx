"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/forms/submit-button";

import {
  gerarLinkTemporarioEquipeAction,
  gerarLinkTemporarioResponsavelAction,
  type LinkTemporarioState,
} from "../actions/gerar-link-temporario-action";
import {
  RESET_TOKEN_TTL_HORAS,
  type OrigemLinkTemporario,
} from "../services/link-temporario-rules";

const estadoInicial: LinkTemporarioState = { status: "idle" };

const ACOES = {
  EQUIPE: gerarLinkTemporarioEquipeAction,
  RESPONSAVEL: gerarLinkTemporarioResponsavelAction,
} as const;

function LinkGerado({ caminho }: { caminho: string }) {
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}${caminho}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <p className="font-semibold">Link gerado. Ele aparece só esta vez.</p>
      <input
        aria-label="Link temporário"
        className="h-10 w-full rounded-md border border-emerald-300 bg-white px-2 text-xs text-slate-800"
        onFocus={(event) => event.currentTarget.select()}
        readOnly
        value={link}
      />
      <button
        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        onClick={copiar}
        type="button"
      >
        {copiado ? "Copiado" : "Copiar link"}
      </button>
      <p className="text-xs">
        Vale por {RESET_TOKEN_TTL_HORAS} horas e funciona uma única vez. Envie
        somente à própria pessoa, sem encaminhar a grupos. Gerar outro link
        cancela este.
      </p>
    </div>
  );
}

export function GerarLinkTemporarioForm({
  origem,
  usuarioId,
}: {
  origem: OrigemLinkTemporario;
  usuarioId: string;
}) {
  const [state, action] = useActionState(ACOES[origem], estadoInicial);

  if (state.status === "success" && state.caminho) {
    return <LinkGerado caminho={state.caminho} />;
  }

  return (
    <form action={action} className="space-y-1">
      <input name="usuarioId" type="hidden" value={usuarioId} />
      <SubmitButton pendingLabel="Gerando..." variant="secondary">
        Gerar link temporário
      </SubmitButton>
      {state.status === "error" && state.message ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
