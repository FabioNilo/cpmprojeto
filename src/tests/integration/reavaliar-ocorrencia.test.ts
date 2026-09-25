import { describe, expect, it } from "vitest";

import { prisma } from "@/db/prisma";
import { reavaliarOcorrencia } from "@/modules/disciplina/services/ocorrencia-status-service";

import { criarColegio, criarUsuarioComPerfil, criarPerfil } from "./helpers/factories";

// Regressao do bug reportado pelo usuario: aceitar a manifestacao de um
// aluno (justificativa acolhida -> processo JUSTIFICADO) nao passa pela
// decisao (D4), entao nada recalculava o status da ocorrencia - ela ficava
// presa em EM_ANALISE para sempre, mesmo com o unico processo ja resolvido.
async function criarOcorrenciaComProcessos(statusProcessos: string[]) {
  const colegio = await criarColegio();
  const perfil = await criarPerfil(`PERFIL-${Date.now()}`);
  const { usuario } = await criarUsuarioComPerfil({
    colegioId: colegio.id,
    perfilId: perfil.id,
  });

  const ocorrencia = await prisma.ocorrencia.create({
    data: {
      colegioId: colegio.id,
      comunicanteId: usuario.id,
      dataOcorrencia: new Date(),
      descricao: "Fato de teste para reavaliacao de status.",
      status: "EM_ANALISE",
    },
  });

  for (const [indice, status] of statusProcessos.entries()) {
    const aluno = await prisma.aluno.create({ data: { nome: `Aluno Teste ${indice}` } });
    await prisma.ocorrenciaAluno.create({
      data: {
        ocorrenciaId: ocorrencia.id,
        alunoId: aluno.id,
        ordem: indice + 1,
        status: status as never,
      },
    });
  }

  return ocorrencia;
}

describe("reavaliarOcorrencia (integracao)", () => {
  it("fecha para DECIDIDA quando o unico processo foi JUSTIFICADO (manifestacao acolhida)", async () => {
    const ocorrencia = await criarOcorrenciaComProcessos(["JUSTIFICADO"]);
    await prisma.$transaction((tx) => reavaliarOcorrencia(tx, ocorrencia.id));
    const atualizada = await prisma.ocorrencia.findUniqueOrThrow({
      where: { id: ocorrencia.id },
      select: { status: true },
    });
    expect(atualizada.status).toBe("DECIDIDA");
  });

  it("permanece EM_ANALISE enquanto outro processo da mesma comunicacao ainda esta PENDENTE", async () => {
    const ocorrencia = await criarOcorrenciaComProcessos([
      "JUSTIFICADO",
      "PENDENTE",
    ]);
    await prisma.$transaction((tx) => reavaliarOcorrencia(tx, ocorrencia.id));
    const atualizada = await prisma.ocorrencia.findUniqueOrThrow({
      where: { id: ocorrencia.id },
      select: { status: true },
    });
    expect(atualizada.status).toBe("EM_ANALISE");
  });
});
