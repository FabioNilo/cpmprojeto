import { SubmitButton } from "@/components/forms/submit-button";

import { toggleColegioAction } from "../actions/colegio-actions";

type ToggleColegioFormProps = {
  id: string;
  ativo: boolean;
};

export function ToggleColegioForm({ id, ativo }: ToggleColegioFormProps) {
  return (
    <form action={toggleColegioAction}>
      <input name="id" type="hidden" value={id} />
      <input name="ativo" type="hidden" value={ativo ? "false" : "true"} />
      <SubmitButton variant="secondary">
        {ativo ? "Inativar" : "Ativar"}
      </SubmitButton>
    </form>
  );
}
