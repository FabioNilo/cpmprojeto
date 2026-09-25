import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPage } from "@/components/layout/admin-page";
import { AuditoriaDetalhe } from "@/modules/auditoria/components/auditoria-detalhe";
import { getAuditoriaDetalhe } from "@/modules/auditoria/queries/get-auditoria-detalhe";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export default async function AuditoriaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requirePermission(PERMISSIONS.AUDITORIA_READ);
  const { id } = await params;
  const registro = await getAuditoriaDetalhe(id, context.colegioId);

  if (!registro) {
    notFound();
  }

  return (
    <AdminPage
      description="Detalhe do evento de auditoria, com metadados de origem e o comparativo de dados anteriores e novos."
      eyebrow={context.colegioNome}
      title="Registro de auditoria"
    >
      <Link
        className="mb-4 inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        href="/auditoria"
      >
        Voltar para auditoria
      </Link>
      <AuditoriaDetalhe registro={registro} />
    </AdminPage>
  );
}
