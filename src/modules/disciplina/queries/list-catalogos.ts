import "server-only";

import { prisma } from "@/db/prisma";

export async function listCatalogosDisciplinares() {
  const [
    transgressoes,
    atenuantes,
    agravantes,
    tiposSancao,
    tiposElogio,
    faixasComportamento,
    competencias,
    prazos,
  ] = await Promise.all([
    prisma.transgressao.findMany({
      orderBy: [{ natureza: "asc" }, { codigo: "asc" }],
    }),
    prisma.atenuante.findMany({ orderBy: { codigo: "asc" } }),
    prisma.agravante.findMany({ orderBy: { codigo: "asc" } }),
    prisma.tipoSancao.findMany({ orderBy: { ordem: "asc" } }),
    prisma.tipoElogio.findMany({ orderBy: { codigo: "asc" } }),
    prisma.faixaComportamento.findMany({ orderBy: { ordem: "asc" } }),
    prisma.competenciaDisciplinar.findMany({
      orderBy: [{ tipoAto: "asc" }, { perfilCodigo: "asc" }],
    }),
    prisma.prazoProcessual.findMany({ orderBy: { codigo: "asc" } }),
  ]);

  return {
    transgressoes,
    atenuantes,
    agravantes,
    tiposSancao,
    tiposElogio,
    faixasComportamento,
    competencias,
    prazos,
  };
}
