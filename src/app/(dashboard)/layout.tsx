import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getTenantContext } from "@/modules/tenancy/services/tenant-context";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await getTenantContext();

  // Responsavel tem area propria e restrita.
  if (context.ehResponsavel) {
    redirect(context.onboardingPendente ? "/primeiro-acesso" : "/meus-filhos");
  }

  return <AppShell context={context}>{children}</AppShell>;
}
