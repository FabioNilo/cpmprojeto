import { SubmitButton } from "@/components/forms/submit-button";

import { updateAlunoVinculoStatusAction } from "../actions/aluno-actions";

type UpdateAlunoVinculoStatusFormProps = {
  vinculoId: string;
  status: "ATIVO" | "TRANSFERIDO" | "ENCERRADO";
};

export function UpdateAlunoVinculoStatusForm({
  vinculoId,
  status,
}: UpdateAlunoVinculoStatusFormProps) {
  const nextStatus = status === "ATIVO" ? "ENCERRADO" : "ATIVO";

  return (
    <form action={updateAlunoVinculoStatusAction}>
      <input name="vinculoId" type="hidden" value={vinculoId} />
      <input name="status" type="hidden" value={nextStatus} />
      <SubmitButton variant="secondary">
        {status === "ATIVO" ? "Encerrar" : "Reativar"}
      </SubmitButton>
    </form>
  );
}
