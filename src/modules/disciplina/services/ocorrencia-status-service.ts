import "server-only";

import type { Prisma } from "@prisma/client";

import { statusOcorrenciaAposDecisao } from "./decisao-rules";

// anexoA secao 3: sempre que o status de UM processo (OcorrenciaAluno) chega
// a um resultado terminal - decisao (PROCEDENTE/IMPROCEDENTE/ARQUIVADO) OU
// manifestacao acolhida (JUSTIFICADO) - a ocorrencia precisa ser reavaliada:
// so fecha (DECIDIDA) quando NENHUM processo continua PENDENTE. Chamar
// depois de qualquer `tx.ocorrenciaAluno.update` que possa tirar um processo
// de PENDENTE, senao a ocorrencia fica presa em EM_ANALISE para sempre.
export async function reavaliarOcorrencia(
  tx: Prisma.TransactionClient,
  ocorrenciaId: string,
): Promise<void> {
  const ocorrencia = await tx.ocorrencia.findUniqueOrThrow({
    where: { id: ocorrenciaId },
    select: { status: true, alunos: { select: { status: true } } },
  });
  const novoStatus = statusOcorrenciaAposDecisao(
    ocorrencia.alunos.map((a) => a.status),
    ocorrencia.status,
  );
  if (novoStatus !== ocorrencia.status) {
    await tx.ocorrencia.update({
      where: { id: ocorrenciaId },
      data: { status: novoStatus },
    });
  }
}
