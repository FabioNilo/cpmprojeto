import { toggleResponsavelAccessAction } from "../actions/responsavel-actions";

type ToggleResponsavelAccessFormProps = {
  id: string;
  ativo: boolean;
};

export function ToggleResponsavelAccessForm({
  id,
  ativo,
}: ToggleResponsavelAccessFormProps) {
  return (
    <form action={toggleResponsavelAccessAction}>
      <input name="id" type="hidden" value={id} />
      <input name="ativo" type="hidden" value={String(!ativo)} />
      <button
        className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        type="submit"
      >
        {ativo ? "Inativar acesso" : "Reativar acesso"}
      </button>
    </form>
  );
}
