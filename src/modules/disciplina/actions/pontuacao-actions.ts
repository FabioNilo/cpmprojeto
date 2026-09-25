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

import { registrarAjusteSchema } from "../schemas/pontuacao-schemas";
import {
  restauracaoDevida,
  valorRestauracao,
  type SancaoRestauravel,
} from "../services/restauracao-rules";

export async function registrarAjusteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.PONTUACAO_MANAGE);
  const parsed = registrarAjusteSchema.safeParse({
    alunoId: formData.get("alunoId"),
    valor: formData.get("valor"),
    motivo: formData.get("motivo"),
  });
  if (!parsed.success) {
    return actionError("Confira o valor e o motivo do ajuste.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const vinculo = await tx.alunoVinculoColegio.findFirst({
        where: { alunoId: parsed.data.alunoId, colegioId: context.colegioId },
        select: { id: true },
      });
      if (!vinculo) {
        throw new Error("ALUNO_INVALIDO");
      }

      const movimento = await tx.movimentoPontuacao.create({
        data: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          tipo: "AJUSTE_ADMINISTRATIVO",
          valor: parsed.data.valor,
          origemTipo: "ajuste_manual",
          descricao: `Ajuste administrativo: ${parsed.data.motivo}`,
          registradoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "AJUSTE_PONTUACAO",
          entidade: "movimentos_pontuacao",
          entidadeId: movimento.id,
          dadosNovos: { valor: parsed.data.valor, motivo: parsed.data.motivo },
          metadata,
        },
        tx,
      );
    });

    revalidatePath(`/disciplina/comportamento/${parsed.data.alunoId}`);
    revalidatePath("/disciplina/comportamento");
    return actionSuccess("Ajuste registrado no histórico.");
  } catch (error) {
    if (error instanceof Error && error.message === "ALUNO_INVALIDO") {
      return actionError("Aluno sem vínculo no colégio.");
    }
    return actionError("Não foi possível registrar o ajuste.");
  }
}

// anexoA secao 9: restaurar (+impacto) toda sancao com mais de 1 ano que ainda
// nao foi restaurada. Idempotente. Deveria virar rotina agendada.
export async function processarRestauracoesAction(): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.PONTUACAO_MANAGE);

  try {
    const metadata = await getRequestMetadata();
    const agora = new Date();

    const total = await prisma.$transaction(async (tx) => {
      const sancoes = await tx.sancao.findMany({
        where: {
          ocorrenciaAluno: { ocorrencia: { colegioId: context.colegioId } },
          impactoPontos: { lt: 0 },
          status: { not: "ANULADA" },
        },
        select: {
          id: true,
          impactoPontos: true,
          aplicadaEm: true,
          status: true,
          tipoSancaoCodigo: true,
          ocorrenciaAluno: { select: { alunoId: true } },
        },
      });

      const jaRestauradas = await tx.movimentoPontuacao.findMany({
        where: {
          colegioId: context.colegioId,
          origemTipo: "sancao_restauracao",
          origemId: { in: sancoes.map((s) => s.id) },
        },
        select: { origemId: true },
      });
      const restauradas = new Set(jaRestauradas.map((m) => m.origemId));

      let contador = 0;
      for (const sancao of sancoes) {
        const candidato: SancaoRestauravel = {
          id: sancao.id,
          impactoPontos: Number(sancao.impactoPontos),
          aplicadaEm: sancao.aplicadaEm,
          status: sancao.status,
          jaRestaurada: restauradas.has(sancao.id),
        };
        if (!restauracaoDevida(candidato, agora)) {
          continue;
        }

        await tx.movimentoPontuacao.create({
          data: {
            alunoId: sancao.ocorrenciaAluno.alunoId,
            colegioId: context.colegioId,
            tipo: "RESTAURACAO_SANCAO",
            valor: valorRestauracao(Number(sancao.impactoPontos)),
            origemTipo: "sancao_restauracao",
            origemId: sancao.id,
            descricao: `Restauração anual da sanção ${sancao.tipoSancaoCodigo}`,
            registradoPorId: context.usuarioId,
          },
        });
        contador += 1;
      }

      if (contador > 0) {
        await registerAudit(
          {
            usuarioId: context.usuarioId,
            colegioId: context.colegioId,
            acao: "PROCESSAMENTO_RESTAURACOES",
            entidade: "movimentos_pontuacao",
            dadosNovos: { restauracoes: contador },
            metadata,
          },
          tx,
        );
      }

      return contador;
    });

    revalidatePath("/disciplina/comportamento");
    return actionSuccess(
      total === 0
        ? "Nenhuma restauração devida no momento."
        : `${total} restauração(ões) lançada(s) no histórico.`,
    );
  } catch {
    return actionError("Não foi possível processar as restaurações.");
  }
}
