import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { getCurrentSession } from "@/modules/auth/services/session-service";
import { validarTokenRecuperacao } from "@/modules/auth/services/password-reset-service";

import { ResetPasswordForm } from "./reset-password-form";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  const { token } = await searchParams;
  const tokenValor = Array.isArray(token) ? token[0] : token;
  const registro = tokenValor
    ? await validarTokenRecuperacao(tokenValor)
    : null;

  return (
    <AuthCard
      eyebrow="Acesso restrito"
      footer={
        <Link className="font-medium text-navy-900 hover:underline" href="/login">
          Voltar para o login
        </Link>
      }
      title="Definir nova senha"
    >
      {registro && tokenValor ? (
        <ResetPasswordForm token={tokenValor} />
      ) : (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Link inválido ou expirado.{" "}
          <Link className="font-medium underline" href="/forgot-password">
            Solicitar um novo
          </Link>
          .
        </p>
      )}
    </AuthCard>
  );
}
