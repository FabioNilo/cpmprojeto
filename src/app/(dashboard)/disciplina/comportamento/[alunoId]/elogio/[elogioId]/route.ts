import { NextResponse } from "next/server";

import { renderizarDocumentoPM } from "@/lib/pdf/pm-documento";
import { specElogio } from "@/modules/disciplina/queries/get-dados-documento";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ alunoId: string; elogioId: string }> },
) {
  const context = await requirePermission(PERMISSIONS.COMPORTAMENTO_READ);
  const { elogioId } = await params;

  const spec = await specElogio(elogioId, context.colegioId);
  if (!spec) {
    return new NextResponse("Elogio nao encontrado.", { status: 404 });
  }

  const bytes = await renderizarDocumentoPM(spec);
  const corpo = bytes.slice().buffer as ArrayBuffer;

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="elogio.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
