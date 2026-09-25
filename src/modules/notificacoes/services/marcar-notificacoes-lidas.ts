import "server-only";

import { prisma } from "@/db/prisma";
import { registerAudit } from "@/modules/auditoria/services/audit-service";

// Chamada direta de um Server Component (portal /meus-filhos), nao de um
// <form action>: nao ha evento de usuario pra amarrar (a leitura acontece so
// de abrir a tela) e o escopo ja e garantido por getTenantContext() (so
// marca as notificacoes do proprio usuario logado). Marca TUDO como lido de
// uma vez, conforme decidido - nao por notificacao individual.
export async function marcarNotificacoesComoLidas(
  usuarioId: string,
  colegioId: string,
): Promise<void> {
  const resultado = await prisma.notificacaoResponsavel.updateMany({
    where: { responsavel: { usuarioId }, lidoEm: null },
    data: { lidoEm: new Date() },
  });

  if (resultado.count > 0) {
    await registerAudit({
      usuarioId,
      colegioId,
      acao: "NOTIFICACOES_LIDAS",
      entidade: "notificacoes_responsavel",
      dadosNovos: { quantidade: resultado.count },
    });
  }
}
