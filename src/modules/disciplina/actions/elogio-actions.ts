"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import { registrarElogioSchema } from "../schemas/pontuacao-schemas";
import { formatarNumeroElogio } from "../services/elogio-rules";
import { proximoNumero } from "../services/numeracao-service";

export async function registrarElogioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ELOGIOS_REGISTER);
  const parsed = registrarElogioSchema.safeParse({
    alunoId: formData.get("alunoId"),
    tipoElogioCodigo: formData.get("tipoElogioCodigo"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do elogio.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const vinculo = await tx.alunoVinculoColegio.findFirst({
        where: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          status: "ATIVO",
        },
        select: { id: true },
      });
      if (!vinculo) {
        throw new Error("ALUNO_INVALIDO");
      }

      const tipo = await tx.tipoElogio.findFirst({
        where: { codigo: parsed.data.tipoElogioCodigo, ativo: true },
        select: { codigo: true, nome: true, valorPontos: true },
      });
      if (!tipo) {
        throw new Error("TIPO_INVALIDO");
      }

      const colegio = await tx.colegio.findUniqueOrThrow({
        where: { id: context.colegioId },
        select: { codigo: true },
      });

      // Elogio ja nasce um-por-aluno: numeracao oficial atribuida na hora do
      // registro, sem etapa de "envio" separada (nao ha rascunho aqui).
      const ano = new Date().getFullYear();
      const sequencial = await proximoNumero(
        tx,
        context.colegioId,
        "ELOGIO",
        ano,
      );
      const numero = formatarNumeroElogio(colegio.codigo, ano, sequencial);

      const elogio = await tx.elogio.create({
        data: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          tipoElogioCodigo: tipo.codigo,
          valorPontos: tipo.valorPontos,
          descricao: parsed.data.descricao,
          registradoPorId: context.usuarioId,
          numero,
          sequencial,
          anoNumeracao: ano,
        },
      });

      await tx.movimentoPontuacao.create({
        data: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          tipo: "ELOGIO",
          valor: Number(tipo.valorPontos),
          origemTipo: "elogio",
          origemId: elogio.id,
          descricao: `Elogio ${tipo.codigo}: ${parsed.data.descricao}`,
          registradoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REGISTRO_ELOGIO",
          entidade: "elogios",
          entidadeId: elogio.id,
          dadosNovos: { tipo: tipo.codigo, valor: Number(tipo.valorPontos) },
          metadata,
        },
        tx,
      );
    });

    revalidatePath(`/disciplina/comportamento/${parsed.data.alunoId}`);
    revalidatePath("/disciplina/comportamento");
    return actionSuccess("Elogio registrado.");
  } catch (error) {
    if (error instanceof Error && error.message === "ALUNO_INVALIDO") {
      return actionError("Aluno sem vínculo ativo no colégio.");
    }
    if (error instanceof Error && error.message === "TIPO_INVALIDO") {
      return actionError("Tipo de elogio inválido.");
    }
    return actionError("Não foi possível registrar o elogio.");
  }
}
