import { NextResponse } from "next/server";

import { listAuditoriaParaExport } from "@/modules/auditoria/queries/list-auditoria";
import {
  AUDITORIA_EXPORT_LIMIT,
  parseAuditoriaFilters,
} from "@/modules/auditoria/schemas/auditoria-filter-schema";
import { toAuditoriaCsv } from "@/modules/auditoria/services/auditoria-csv";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = await requirePermission(PERMISSIONS.AUDITORIA_READ);
  const { searchParams } = new URL(request.url);
  const filtros = parseAuditoriaFilters(Object.fromEntries(searchParams));
  const registros = await listAuditoriaParaExport(
    context.colegioId,
    filtros,
    AUDITORIA_EXPORT_LIMIT,
  );

  const bom = String.fromCharCode(0xfeff);
  const csv = `${bom}${toAuditoriaCsv(registros)}`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
