import "server-only";

import { prisma } from "@/db/prisma";

export async function contarNaoLidas(usuarioId: string): Promise<number> {
  return prisma.notificacaoResponsavel.count({
    where: { responsavel: { usuarioId }, lidoEm: null },
  });
}

export async function listNotificacoesResponsavel(usuarioId: string) {
  return prisma.notificacaoResponsavel.findMany({
    where: { responsavel: { usuarioId } },
    orderBy: { criadoEm: "desc" },
    take: 30,
    select: {
      id: true,
      tipo: true,
      titulo: true,
      mensagem: true,
      criadoEm: true,
      lidoEm: true,
      ocorrenciaAlunoId: true,
    },
  });
}
