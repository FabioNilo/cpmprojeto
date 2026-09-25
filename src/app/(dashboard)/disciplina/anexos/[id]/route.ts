import { NextResponse } from "next/server";

import { prisma } from "@/db/prisma";
import { urlAssinada } from "@/lib/storage/supabase-storage";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requireAnyPermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_READ_OWN,
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
    PERMISSIONS.ANEXOS_MANAGE,
  ]);
  const { id } = await params;

  const anexo = await prisma.anexo.findFirst({
    where: { id, colegioId: context.colegioId, removidoEm: null },
    select: { storagePath: true },
  });
  if (!anexo) {
    return new NextResponse("Anexo nao encontrado.", { status: 404 });
  }

  try {
    const url = await urlAssinada(anexo.storagePath, 120);
    return NextResponse.redirect(url);
  } catch {
    return new NextResponse("Storage indisponivel.", { status: 502 });
  }
}
