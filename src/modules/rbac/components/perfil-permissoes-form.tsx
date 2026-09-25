"use client";

import { useActionState } from "react";

import { ActionFeedback } from "@/components/forms/action-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { idleActionState } from "@/lib/actions/action-state";

import { setPerfilPermissoesAction } from "../actions/perfil-permissao-actions";

type PermissaoOption = {
  codigo: string;
  nome: string;
  descricao: string | null;
};

type PerfilPermissoesFormProps = {
  perfilId: number;
  permissoes: PermissaoOption[];
  atuais: string[];
  travado?: boolean;
};

export function PerfilPermissoesForm({
  perfilId,
  permissoes,
  atuais,
  travado = false,
}: PerfilPermissoesFormProps) {
  const [state, formAction] = useActionState(
    setPerfilPermissoesAction,
    idleActionState,
  );
  const selecionadas = new Set(atuais);

  return (
    <details className="w-80 rounded-md border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-navy-900">
        Permissões ({atuais.length})
      </summary>

      {travado ? (
        <p className="mt-3 text-sm text-slate-600">
          As permissões deste perfil são fixas e não podem ser alteradas aqui.
        </p>
      ) : (
        <form action={formAction} className="mt-3 space-y-3">
          <input name="perfilId" type="hidden" value={perfilId} />
          <ul className="space-y-2">
            {permissoes.map((permissao) => (
              <li key={permissao.codigo}>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    defaultChecked={selecionadas.has(permissao.codigo)}
                    name="permissoes"
                    type="checkbox"
                    value={permissao.codigo}
                  />
                  <span>
                    <span className="font-medium">{permissao.codigo}</span>
                    <span className="block text-xs text-slate-500">
                      {permissao.nome}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <SubmitButton pendingLabel="Salvando...">
              Salvar permissoes
            </SubmitButton>
            <ActionFeedback state={state} />
          </div>
        </form>
      )}
    </details>
  );
}
