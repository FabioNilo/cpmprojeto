import { SubmitButton } from "@/components/forms/submit-button";

type ToggleCatalogoFormProps = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  ativo: boolean;
};

export function ToggleCatalogoForm({
  action,
  id,
  ativo,
}: ToggleCatalogoFormProps) {
  return (
    <form action={action}>
      <input name="id" type="hidden" value={id} />
      <input name="ativo" type="hidden" value={ativo ? "false" : "true"} />
      <SubmitButton variant="secondary">
        {ativo ? "Inativar" : "Ativar"}
      </SubmitButton>
    </form>
  );
}
