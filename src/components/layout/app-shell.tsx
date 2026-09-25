import { NAV_ITEMS } from "@/config/navigation";
import { logoutAction } from "@/modules/auth/actions/logout-action";
import { TenantSwitcher } from "@/modules/tenancy/components/tenant-switcher";
import type { TenantContext } from "@/modules/tenancy/services/tenant-context";

import { AppNav } from "./app-nav";
import { Breadcrumbs } from "./breadcrumbs";

type AppShellProps = {
  context: TenantContext;
  children: React.ReactNode;
};

export function AppShell({ context, children }: AppShellProps) {
  const navItems = NAV_ITEMS.filter((item) =>
    context.permissoes.includes(item.permission),
  ).map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-600">
              Colégio ativo
            </p>
            <p className="truncate text-base font-semibold text-slate-950 sm:text-lg">
              {context.colegioNome}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:justify-end sm:gap-3">
            <TenantSwitcher context={context} />
            <form action={logoutAction}>
              <button
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                type="submit"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl border-t border-slate-100 px-3 py-2 sm:border-t-0 sm:pb-3">
          <AppNav items={navItems} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-5 sm:py-8">
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
}
