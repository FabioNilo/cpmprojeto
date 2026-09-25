import { NextResponse } from "next/server";

import { renderizarFad } from "@/lib/pdf/fad-documento";
import { specFad } from "@/modules/disciplina/queries/get-dados-documento";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ alunoId: string }> },
) {
  const context = await requirePermission(PERMISSIONS.COMPORTAMENTO_READ);
  const { alunoId } = await params;

  const spec = await specFad(alunoId, context.colegioId);
  if (!spec) {
    return new NextResponse(
      "Nenhuma FAD gerada para este aluno. Gere a ficha primeiro.",
      { status: 404 },
    );
  }

  const bytes = await renderizarFad(spec);
  const corpo = bytes.slice().buffer as ArrayBuffer;

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="fad.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
