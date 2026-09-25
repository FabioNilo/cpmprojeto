import { NextResponse } from "next/server";

import { renderizarDocumentoPM } from "@/lib/pdf/pm-documento";
import {
  specComunicacao,
  specDecisao,
  specDespacho,
  specParecer,
  specPortaria,
  specTermoCiencia,
} from "@/modules/disciplina/queries/get-dados-documento";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requireAnyPermission } from "@/modules/rbac/services/rbac-service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await requireAnyPermission([
    PERMISSIONS.OCORRENCIAS_READ_OWN,
    PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
  ]);
  await params; // id da ocorrencia so organiza a URL - cada tipo usa seu proprio id de query.
  const sp = new URL(request.url).searchParams;
  const tipo = sp.get("tipo") ?? "";
  const colegioId = context.colegioId;

  let spec = null;
  switch (tipo) {
    case "COMUNICACAO":
      // Um numero, um aluno: sempre o processo (OcorrenciaAluno), nunca a
      // ocorrencia inteira - ver modelos-documento.ts.
      spec = await specComunicacao(sp.get("processoId") ?? "", colegioId);
      break;
    case "TERMO_CIENCIA":
      spec = await specTermoCiencia(
        sp.get("processoId") ?? "",
        colegioId,
        sp.get("alvo") === "DECISAO" ? "DECISAO" : "OCORRENCIA",
      );
      break;
    case "DECISAO":
      spec = await specDecisao(sp.get("processoId") ?? "", colegioId);
      break;
    case "DESPACHO_RECONSIDERACAO":
      spec = await specDespacho(sp.get("reconsideracaoId") ?? "", colegioId);
      break;
    case "PORTARIA_AFASTAMENTO":
      spec = await specPortaria(sp.get("afastamentoId") ?? "", colegioId);
      break;
    case "PARECER_CONSELHO":
      spec = await specParecer(sp.get("conselhoId") ?? "", colegioId);
      break;
    default:
      return new NextResponse("Tipo de documento invalido.", { status: 400 });
  }

  if (!spec) {
    return new NextResponse("Documento indisponivel.", { status: 404 });
  }

  const bytes = await renderizarDocumentoPM(spec);
  const corpo = bytes.slice().buffer as ArrayBuffer;

  return new NextResponse(corpo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${tipo.toLowerCase()}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
