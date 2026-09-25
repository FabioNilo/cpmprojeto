import Link from "next/link";

type ProtectedPlaceholderProps = {
  title: string;
  description: string;
};

export function ProtectedPlaceholder({
  title,
  description,
}: ProtectedPlaceholderProps) {
  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10">
      <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-sm font-semibold uppercase text-gold-600">
          Área protegida
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
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
