import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase text-gold-600">
          Acesso indisponível
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950">
          Não foi possível abrir esta área
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A rota pode não existir ou seu perfil não possui permissão no colégio
          ativo.
        </p>
        <Link
          className="mt-6 inline-flex h-10 items-center rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          href="/dashboard"
        >
          Voltar ao dashboard
        </Link>
      </section>
    </main>
  );
}
