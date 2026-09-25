import { SubmitButton } from "@/components/forms/submit-button";

import { toggleAnoLetivoAction } from "../actions/ano-letivo-actions";

type ToggleAnoLetivoFormProps = {
  id: string;
  ativo: boolean;
};

export function ToggleAnoLetivoForm({ id, ativo }: ToggleAnoLetivoFormProps) {
  return (
    <form action={toggleAnoLetivoAction}>
      <input name="id" type="hidden" value={id} />
      <input name="ativo" type="hidden" value={ativo ? "false" : "true"} />
      <SubmitButton variant="secondary">
        {ativo ? "Encerrar" : "Reabrir"}
      </SubmitButton>
    </form>
  );
}
