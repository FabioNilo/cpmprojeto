import { SubmitButton } from "@/components/forms/submit-button";

import { toggleUsuarioAction } from "../actions/usuario-actions";

type ToggleUsuarioFormProps = {
  id: string;
  ativo: boolean;
};

export function ToggleUsuarioForm({ id, ativo }: ToggleUsuarioFormProps) {
  return (
    <form action={toggleUsuarioAction}>
      <input name="id" type="hidden" value={id} />
      <input name="ativo" type="hidden" value={ativo ? "false" : "true"} />
      <SubmitButton variant="secondary">
        {ativo ? "Inativar" : "Ativar"}
      </SubmitButton>
    </form>
  );
}
