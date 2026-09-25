import { SubmitButton } from "@/components/forms/submit-button";

import {
  enviarOcorrenciaAction,
  iniciarAveriguacaoAction,
} from "../actions/ocorrencia-actions";

export function EnviarOcorrenciaForm({ id }: { id: string }) {
  return (
    <form action={enviarOcorrenciaAction}>
      <input name="id" type="hidden" value={id} />
      <SubmitButton pendingLabel="Enviando...">
        Enviar comunicação (gera número)
      </SubmitButton>
    </form>
  );
}

export function IniciarAveriguacaoForm({ id }: { id: string }) {
  return (
    <form action={iniciarAveriguacaoAction}>
      <input name="id" type="hidden" value={id} />
      <SubmitButton pendingLabel="Iniciando..." variant="secondary">
        Iniciar averiguação
      </SubmitButton>
    </form>
  );
}
