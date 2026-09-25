import { redirect } from "next/navigation";

import { PrimeiroAcessoForm } from "@/modules/responsaveis/components/primeiro-acesso-form";
import {
  TERMO_RESPONSAVEL_PARAGRAFOS,
  TERMO_RESPONSAVEL_TITULO,
  TERMO_RESPONSAVEL_VERSAO,
} from "@/modules/responsaveis/termo";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

export const dynamic = "force-dynamic";

export default async function PrimeiroAcessoPage() {
  const context = await getTenantContext();
  if (!context.onboardingPendente) {
    redirect("/meus-filhos");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-950">
          Primeiro acesso
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Aceite o termo e defina uma senha pessoal para continuar.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          {TERMO_RESPONSAVEL_TITULO}
        </h2>
        <p className="mb-2 text-xs text-slate-500">
          Versão {TERMO_RESPONSAVEL_VERSAO}
        </p>
        <div className="max-h-72 space-y-2 overflow-auto pr-1 text-sm leading-6 text-slate-700">
          {TERMO_RESPONSAVEL_PARAGRAFOS.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <PrimeiroAcessoForm />
    </div>
  );
}
