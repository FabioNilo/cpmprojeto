import "server-only";

import { prisma } from "@/db/prisma";

export async function listAnexosDaOcorrencia(
  ocorrenciaId: string,
  colegioId: string,
) {
  return prisma.anexo.findMany({
    where: { ocorrenciaId, colegioId, removidoEm: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      categoria: true,
      origem: true,
      nomeArquivo: true,
      contentType: true,
      tamanhoBytes: true,
      ocorrenciaAlunoId: true,
      createdAt: true,
      enviadoPor: { select: { nome: true } },
    },
  });
}
