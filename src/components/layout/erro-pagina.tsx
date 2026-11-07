"use client";

import { useEffect } from "react";

import Link from "next/link";

export function ErroPagina({
  error,
  reset,
  voltarPara,
}: {
  error: Error;
  reset: () => void;
  voltarPara: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      className="rounded-lg border border-slate-200 bg-white p-6"
      role="alert"
    >
      <h1 className="text-xl font-semibold text-slate-950">
        Não foi possível abrir esta tela
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Pode ser uma falha de conexão. Nenhum dado foi perdido pelo erro ao abrir
        a tela. Tente de novo em instantes.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button
          className="h-10 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          onClick={reset}
          type="button"
        >
          Tentar de novo
        </button>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={voltarPara}
        >
          Voltar ao início
        </Link>
      </div>
    </section>
  );
}
