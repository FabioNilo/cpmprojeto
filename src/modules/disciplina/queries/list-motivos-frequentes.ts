import "server-only";

import { prisma } from "@/db/prisma";

// Alimenta o dropdown "motivo frequente" da Nova Comunicacao: transgressoes
// ativas do catalogo (ver seed.ts - populado a partir da analise de
// frequencia do bancoFad), pra preencher a descricao e opcionalmente
// registrar a sugestao em Ocorrencia.motivoSugeridoId.
export async function listMotivosFrequentes() {
  return prisma.transgressao.findMany({
    where: { ativo: true },
    orderBy: [{ natureza: "asc" }, { codigo: "asc" }],
    select: { id: true, codigo: true, descricao: true, natureza: true },
  });
}
