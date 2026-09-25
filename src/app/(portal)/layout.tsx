import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/modules/auth/actions/logout-action";
import { contarNaoLidas } from "@/modules/notificacoes/queries/list-notificacoes-responsavel";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getTenantContext();

  if (!context.ehResponsavel) {
    redirect("/dashboard");
  }

  const naoLidas = context.onboardingPendente
    ? 0
    : await contarNaoLidas(context.usuarioId);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gold-600">
              Portal do Responsável
            </p>
            <p className="truncate text-sm font-semibold text-slate-950">
              {context.colegioNome}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {naoLidas > 0 ? (
              <Link
                className="inline-flex h-10 items-center rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900"
                href="/meus-filhos"
              >
                Avisos ({naoLidas})
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                type="submit"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-5">{children}</main>
    </div>
  );
}
