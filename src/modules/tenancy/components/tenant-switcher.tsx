import { PERMISSIONS } from "@/modules/rbac/permissions";
import type { TenantContext } from "@/modules/tenancy/services/tenant-context";
import { listSwitchableColegios } from "../queries/list-switchable-colegios";
import { switchTenantAction } from "../actions/switch-tenant-action";

type TenantSwitcherProps = {
  context: TenantContext;
};

export async function TenantSwitcher({ context }: TenantSwitcherProps) {
  if (!context.permissoes.includes(PERMISSIONS.TENANCY_SWITCH)) {
    return null;
  }

  const vinculos = await listSwitchableColegios(context.usuarioId);

  if (vinculos.length <= 1) {
    return null;
  }

  return (
    <form action={switchTenantAction} className="flex items-end gap-2">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">
          Trocar CPM
        </span>
        <select
          className="h-10 max-w-64 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
          defaultValue={context.colegioId}
          name="colegioId"
        >
          {vinculos.map((vinculo) => (
            <option key={vinculo.colegio.id} value={vinculo.colegio.id}>
              {vinculo.colegio.codigo}
            </option>
          ))}
        </select>
      </label>
      <button
        className="h-10 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
        type="submit"
      >
        Aplicar
      </button>
    </form>
  );
}
