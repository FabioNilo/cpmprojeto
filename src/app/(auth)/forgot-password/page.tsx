import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/layout/auth-card";
import { getCurrentSession } from "@/modules/auth/services/session-service";

import { ForgotPasswordForm } from "./forgot-password-form";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <AuthCard
      eyebrow="Acesso restrito"
      footer={
        <Link className="font-medium text-navy-900 hover:underline" href="/login">
          Voltar para o login
        </Link>
      }
      title="Recuperar senha"
    >
      <p className="mb-5 text-sm leading-6 text-slate-600">
        Informe seu CPF ou usuário. A administração do colégio recebe o pedido
        e entra em contato com um link temporário para você definir uma nova
        senha.
      </p>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
