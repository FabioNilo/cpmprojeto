"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { isUniqueConstraintError } from "@/lib/db/prisma-errors";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import type { TenantContext } from "@/modules/tenancy/services/tenant-context";
import { ehResponsavelDoProcesso } from "@/modules/responsaveis/queries/portal";

import {
  avaliarManifestacaoSchema,
  confirmarCienciaSchema,
  registrarManifestacaoSchema,
} from "../schemas/manifestacao-schemas";
import {
  podeAvaliarManifestacao,
  podeConfirmarCiencia,
  podeManifestar,
  statusAposAvaliacao,
  statusOcorrenciaAposCiencia,
  statusOcorrenciaAposManifestacao,
} from "../services/manifestacao-rules";
import { reavaliarOcorrencia } from "../services/ocorrencia-status-service";

function caminho(ocorrenciaId: string) {
  return `/disciplina/ocorrencias/${ocorrenciaId}`;
}

// Staff (com leitura da escola) pode atuar em qualquer processo do colegio.
// Sem isso, so o responsavel do aluno do processo.
async function assertPodeAtuar(
  context: TenantContext,
  ocorrenciaAlunoId: string,
): Promise<void> {
  if (context.permissoes.includes(PERMISSIONS.OCORRENCIAS_READ_SCHOOL)) {
    return;
  }
  const ok = await ehResponsavelDoProcesso(
    context.usuarioId,
    ocorrenciaAlunoId,
  );
  if (!ok) {
    throw new Error("SEM_ACESSO");
  }
}

async function carregarProcesso(id: string, colegioId: string) {
  return prisma.ocorrenciaAluno.findFirst({
    where: { id, ocorrencia: { colegioId } },
    select: {
      id: true,
      status: true,
      ocorrenciaId: true,
      ocorrencia: { select: { id: true, status: true } },
      _count: { select: { manifestacoes: true, ciencias: true } },
    },
  });
}

export async function registrarManifestacaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.MANIFESTACOES_CREATE);
  const parsed = registrarManifestacaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    tipo: formData.get("tipo"),
    texto: formData.get("texto"),
    viaPresencial: formData.get("viaPresencial") ?? undefined,
  });

  if (!parsed.success) {
    return actionError("Confira os dados da manifestação.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await carregarProcesso(
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }
      await assertPodeAtuar(context, processo.id);
      if (!podeManifestar(processo.ocorrencia.status, processo.status)) {
        throw new Error("FORA_DO_PRAZO");
      }

      const manifestacao = await tx.manifestacao.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          tipo: parsed.data.tipo,
          texto: parsed.data.texto,
          viaPresencial: parsed.data.viaPresencial,
          autorId: context.usuarioId,
          registradoPorId: context.usuarioId,
        },
      });

      const novoStatus = statusOcorrenciaAposManifestacao(
        processo.ocorrencia.status,
      );
      if (novoStatus !== processo.ocorrencia.status) {
        await tx.ocorrencia.update({
          where: { id: processo.ocorrenciaId },
          data: { status: novoStatus },
        });
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REGISTRO_MANIFESTACAO",
          entidade: "manifestacoes",
          entidadeId: manifestacao.id,
          dadosNovos: {
            ocorrenciaAlunoId: processo.id,
            tipo: manifestacao.tipo,
          },
          metadata,
        },
        tx,
      );

      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Manifestação registrada.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function confirmarCienciaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.CIENCIAS_CONFIRM);
  const parsed = confirmarCienciaSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    meio: formData.get("meio"),
    observacao: formData.get("observacao"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da ciência.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await carregarProcesso(
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }
      await assertPodeAtuar(context, processo.id);
      if (
        !podeConfirmarCiencia(
          processo.ocorrencia.status,
          processo._count.ciencias > 0,
        )
      ) {
        throw new Error("CIENCIA_INDISPONIVEL");
      }

      const ciencia = await tx.ciencia.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          sobre: "OCORRENCIA",
          meio: parsed.data.meio,
          observacao: parsed.data.observacao,
          confirmadaPorId: context.usuarioId,
        },
      });

      const novoStatus = statusOcorrenciaAposCiencia(processo.ocorrencia.status);
      if (novoStatus !== processo.ocorrencia.status) {
        await tx.ocorrencia.update({
          where: { id: processo.ocorrenciaId },
          data: { status: novoStatus },
        });
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CONFIRMACAO_CIENCIA",
          entidade: "ciencias",
          entidadeId: ciencia.id,
          dadosNovos: { ocorrenciaAlunoId: processo.id, meio: ciencia.meio },
          metadata,
        },
        tx,
      );

      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Ciência registrada.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function avaliarManifestacaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.MANIFESTACOES_AVALIAR);
  const parsed = avaliarManifestacaoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    resultado: formData.get("resultado"),
    parecer: formData.get("parecer"),
  });

  if (!parsed.success) {
    return actionError("Confira o parecer.");
  }

  const acolhida = parsed.data.resultado === "ACOLHER";

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await carregarProcesso(
        parsed.data.ocorrenciaAlunoId,
        context.colegioId,
      );
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }
      if (
        !podeAvaliarManifestacao(
          processo.status,
          processo._count.manifestacoes,
        )
      ) {
        throw new Error("AVALIACAO_INDISPONIVEL");
      }

      await tx.ocorrenciaAluno.update({
        where: { id: processo.id },
        data: {
          manifestacaoAcolhida: acolhida,
          parecerManifestacao: parsed.data.parecer,
          avaliadoPorId: context.usuarioId,
          avaliadoEm: new Date(),
          status: statusAposAvaliacao(acolhida),
        },
      });

      // Justificativa acolhida tira o processo de PENDENTE sem passar pela
      // decisao (D4) - sem isto a ocorrencia ficava presa em EM_ANALISE para
      // sempre mesmo com todos os processos ja resolvidos.
      await reavaliarOcorrencia(tx, processo.ocorrenciaId);

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "AVALIACAO_MANIFESTACAO",
          entidade: "ocorrencia_alunos",
          entidadeId: processo.id,
          dadosNovos: { acolhida },
          metadata,
        },
        tx,
      );

      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess(
      acolhida
        ? "Justificativa acolhida: processo JUSTIFICADO, sem sanção."
        : "Justificativa indeferida: processo segue para análise.",
    );
  } catch (error) {
    return mapErro(error);
  }
}

function mapErro(error: unknown): ActionState {
  const mensagens: Record<string, string> = {
    PROCESSO_NAO_ENCONTRADO: "Processo não encontrado no colégio ativo.",
    SEM_ACESSO: "Você não tem acesso a este processo.",
    FORA_DO_PRAZO: "Este processo não aceita mais manifestação.",
    CIENCIA_INDISPONIVEL:
      "A ciência já foi registrada ou o processo não está nesse estágio.",
    AVALIACAO_INDISPONIVEL:
      "Não há manifestação para avaliar ou o processo já foi decidido.",
  };
  if (error instanceof Error && mensagens[error.message]) {
    return actionError(mensagens[error.message]);
  }
  if (isUniqueConstraintError(error)) {
    return actionError("A ciência já foi registrada para este processo.");
  }
  return actionError("Não foi possível concluir a operação.");
}
