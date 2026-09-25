import "server-only";

import { prisma } from "@/db/prisma";

// Leve: usada na renderizacao normal da tela de comportamento. NAO traz
// `conteudo` (o snapshot completo do historico do aluno, que pode ser grande
// para quem tem muitos processos) - isso evita carregar esse JSON do banco
// em toda visita a pagina, so pra mostrar versao/data/hash.
export async function getFichaAtual(alunoId: string, colegioId: string) {
  return prisma.fichaDisciplinar.findFirst({
    where: { alunoId, colegioId },
    orderBy: { versao: "desc" },
    select: {
      id: true,
      versao: true,
      hash: true,
      geradoEm: true,
      geradoPor: { select: { nome: true } },
    },
  });
}

// So chamada sob demanda (clique em "Ver conteudo"), nunca na renderizacao
// normal da pagina - ver buscar-conteudo-ficha-action.ts.
export async function getConteudoFicha(fichaId: string, colegioId: string) {
  return prisma.fichaDisciplinar.findFirst({
    where: { id: fichaId, colegioId },
    select: { conteudo: true },
  });
}

export async function listFichas(alunoId: string, colegioId: string) {
  return prisma.fichaDisciplinar.findMany({
    where: { alunoId, colegioId },
    orderBy: { versao: "desc" },
    select: {
      id: true,
      versao: true,
      hash: true,
      geradoEm: true,
      geradoPor: { select: { nome: true } },
    },
  });
}
