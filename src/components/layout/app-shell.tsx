import { montarMenuCelular, NAV_ITEMS } from "@/config/navigation";
import { logoutAction } from "@/modules/auth/actions/logout-action";
import { TenantSwitcher } from "@/modules/tenancy/components/tenant-switcher";
import type { TenantContext } from "@/modules/tenancy/services/tenant-context";

import { AppNav } from "./app-nav";
import { Breadcrumbs } from "./breadcrumbs";
import { MobileNav } from "./mobile-nav";

type AppShellProps = {
  context: TenantContext;
  children: React.ReactNode;
};

function BotaoSair({ larguraTotal }: { larguraTotal?: boolean }) {
  return (
    <form action={logoutAction}>
      <button
        className={`h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${
          larguraTotal ? "w-full" : ""
        }`}
        type="submit"
      >
        Sair
      </button>
    </form>
  );
}

export function AppShell({ context, children }: AppShellProps) {
  const navItems = NAV_ITEMS.filter((item) =>
    context.permissoes.includes(item.permission),
  ).map(({ href, label }) => ({ href, label }));
  const menuCelular = montarMenuCelular(context.permissoes);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Celular: faixa compacta; as acoes ficam no menu "Mais". */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)] print:hidden md:hidden">
        <p className="truncate px-4 py-3 text-sm font-semibold text-slate-950">
          {context.colegioNome}
        </p>
      </header>

      <header className="hidden border-b border-slate-200 bg-white print:hidden md:block">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-600">
              Colégio ativo
            </p>
            <p className="truncate text-lg font-semibold text-slate-950">
              {context.colegioNome}
            </p>
          </div>
          <div className="flex flex-wrap items-end justify-end gap-3">
            <TenantSwitcher context={context} />
            <BotaoSair />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-3 pb-3">
          <AppNav items={navItems} />
        </div>
      </header>

      <main className="espaco-barra-inferior mx-auto max-w-6xl px-4 py-4 sm:px-5 md:py-8">
        <Breadcrumbs />
        {children}
      </main>

      <MobileNav
        colegioNome={context.colegioNome}
        extras={
          <>
            <TenantSwitcher context={context} />
            <BotaoSair larguraTotal />
          </>
        }
        grupos={menuCelular.grupos}
        principais={menuCelular.principais}
      />
    </div>
  );
}
