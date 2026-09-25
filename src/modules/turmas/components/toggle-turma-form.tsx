import { SubmitButton } from "@/components/forms/submit-button";

import { toggleTurmaAction } from "../actions/turma-actions";

type ToggleTurmaFormProps = {
  id: string;
  ativa: boolean;
};

export function ToggleTurmaForm({ id, ativa }: ToggleTurmaFormProps) {
  return (
    <form action={toggleTurmaAction}>
      <input name="id" type="hidden" value={id} />
      <input name="ativa" type="hidden" value={ativa ? "false" : "true"} />
      <SubmitButton variant="secondary">
        {ativa ? "Inativar" : "Ativar"}
      </SubmitButton>
    </form>
  );
}
