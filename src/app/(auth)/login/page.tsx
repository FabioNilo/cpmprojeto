import { redirect } from "next/navigation";

import { getCurrentSession } from "@/modules/auth/services/session-service";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const { reset } = await searchParams;
  const senhaRedefinida = reset === "ok";

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,31,0.96),rgba(7,17,31,0.84),rgba(7,17,31,0.54)),url('/login-background.svg')] bg-cover bg-center"
      />
      <section className="relative z-10 grid min-h-screen place-items-center px-5 py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:px-14">
        <div className="hidden max-w-2xl justify-self-start text-white lg:block">
          <p className="text-sm font-semibold uppercase text-gold-500">
            Colégios da Polícia Militar
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            Sistema Disciplinar CPM
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-200">
            Registro administrativo disciplinar com foco em integridade,
            rastreabilidade, segurança e fidelidade ao regulamento.
          </p>
        </div>

        <div className="w-full max-w-md rounded-lg border border-white/15 bg-white p-7 shadow-2xl">
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase text-gold-600">
              Acesso restrito
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Entrar no sistema
            </h2>
          </div>
          {senhaRedefinida ? (
            <p className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Senha redefinida. Entre com a nova senha.
            </p>
          ) : null}
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
