import { SubmitButton } from "@/components/forms/submit-button";

import { togglePerfilAction } from "../actions/perfil-actions";

type TogglePerfilFormProps = {
  id: number;
  ativo: boolean;
};

export function TogglePerfilForm({ id, ativo }: TogglePerfilFormProps) {
  return (
    <form action={togglePerfilAction}>
      <input name="id" type="hidden" value={id} />
      <input name="ativo" type="hidden" value={ativo ? "false" : "true"} />
      <SubmitButton variant="secondary">
        {ativo ? "Inativar" : "Ativar"}
      </SubmitButton>
    </form>
  );
}
