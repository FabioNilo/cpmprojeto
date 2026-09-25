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

import {
  afastamentoIdSchema,
  atualizarSindicanciaSchema,
  determinarAfastamentoSchema,
  encerrarAfastamentoSchema,
  instaurarConselhoSchema,
  instaurarSindicanciaSchema,
  parecerConselhoSchema,
} from "../schemas/d8-schemas";
import {
  fimAfastamento,
  formatarNumeroConselho,
  formatarNumeroSindicancia,
  podeConcluirConselho,
  podeConcluirSindicancia,
  podeEncerrarAfastamento,
  podeProrrogarAfastamento,
} from "../services/d8-rules";
import { proximoNumero } from "../services/numeracao-service";

function caminho(ocorrenciaId: string) {
  return `/disciplina/ocorrencias/${ocorrenciaId}`;
}

// --- Afastamento cautelar (anexoA secao 13) -------------------------------

export async function determinarAfastamentoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.AFASTAMENTOS_MANAGE);
  const parsed = determinarAfastamentoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    justificativa: formData.get("justificativa"),
    inicioEm: formData.get("inicioEm"),
    diasIniciais: formData.get("diasIniciais") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Informe a justificativa e a data de inicio.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await tx.ocorrenciaAluno.findFirst({
        where: {
          id: parsed.data.ocorrenciaAlunoId,
          ocorrencia: { colegioId: context.colegioId },
        },
        select: { id: true, ocorrenciaId: true },
      });
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }

      const afastamento = await tx.afastamentoCautelar.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          colegioId: context.colegioId,
          justificativa: parsed.data.justificativa,
          diasIniciais: parsed.data.diasIniciais,
          inicioEm: parsed.data.inicioEm,
          fimPrevisto: fimAfastamento(
            parsed.data.inicioEm,
            parsed.data.diasIniciais,
          ),
          determinadoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "AFASTAMENTO_CAUTELAR_DETERMINADO",
          entidade: "afastamentos_cautelares",
          entidadeId: afastamento.id,
          dadosNovos: { dias: parsed.data.diasIniciais },
          metadata,
        },
        tx,
      );
      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Afastamento cautelar determinado (não é sanção).");
  } catch (error) {
    return mapErro(error);
  }
}

async function carregarAfastamento(id: string, colegioId: string) {
  return prisma.afastamentoCautelar.findFirst({
    where: { id, colegioId },
    select: {
      id: true,
      status: true,
      diasIniciais: true,
      fimPrevisto: true,
      ocorrenciaAluno: { select: { ocorrenciaId: true } },
    },
  });
}

export async function prorrogarAfastamentoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.AFASTAMENTOS_MANAGE);
  const parsed = afastamentoIdSchema.safeParse({
    afastamentoId: formData.get("afastamentoId"),
  });
  if (!parsed.success) {
    return actionError("Afastamento inválido.");
  }

  try {
    const afastamento = await carregarAfastamento(
      parsed.data.afastamentoId,
      context.colegioId,
    );
    if (!afastamento) {
      return actionError("Afastamento não encontrado.");
    }
    if (!podeProrrogarAfastamento(afastamento.status)) {
      return actionError("Só é possível uma única prorrogação, com o afastamento ativo.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.afastamentoCautelar.update({
        where: { id: afastamento.id },
        data: {
          status: "PRORROGADO",
          prorrogadoEm: new Date(),
          fimProrrogado: fimAfastamento(
            afastamento.fimPrevisto,
            afastamento.diasIniciais,
          ),
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "AFASTAMENTO_CAUTELAR_PRORROGADO",
          entidade: "afastamentos_cautelares",
          entidadeId: afastamento.id,
          metadata: await getRequestMetadata(),
        },
        tx,
      );
    });

    revalidatePath(caminho(afastamento.ocorrenciaAluno.ocorrenciaId));
    return actionSuccess("Afastamento prorrogado por igual período.");
  } catch {
    return actionError("Não foi possível prorrogar.");
  }
}

export async function encerrarAfastamentoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.AFASTAMENTOS_MANAGE);
  const parsed = encerrarAfastamentoSchema.safeParse({
    afastamentoId: formData.get("afastamentoId"),
    motivo: formData.get("motivo"),
    revogar: formData.get("revogar") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Informe o motivo do encerramento.");
  }

  try {
    const afastamento = await carregarAfastamento(
      parsed.data.afastamentoId,
      context.colegioId,
    );
    if (!afastamento) {
      return actionError("Afastamento não encontrado.");
    }
    if (!podeEncerrarAfastamento(afastamento.status)) {
      return actionError("O afastamento ja foi encerrado.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.afastamentoCautelar.update({
        where: { id: afastamento.id },
        data: {
          status: parsed.data.revogar ? "REVOGADO" : "ENCERRADO",
          encerradoEm: new Date(),
          motivoEncerramento: parsed.data.motivo,
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "AFASTAMENTO_CAUTELAR_ENCERRADO",
          entidade: "afastamentos_cautelares",
          entidadeId: afastamento.id,
          dadosNovos: { revogado: parsed.data.revogar },
          metadata: await getRequestMetadata(),
        },
        tx,
      );
    });

    revalidatePath(caminho(afastamento.ocorrenciaAluno.ocorrenciaId));
    return actionSuccess("Afastamento encerrado.");
  } catch {
    return actionError("Não foi possível encerrar.");
  }
}

// --- Sindicancia --------------------------------------------------------------

export async function instaurarSindicanciaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.SINDICANCIAS_MANAGE);
  const parsed = instaurarSindicanciaSchema.safeParse({
    ocorrenciaId: formData.get("ocorrenciaId"),
    objeto: formData.get("objeto"),
  });
  if (!parsed.success) {
    return actionError("Descreva o objeto da sindicância.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const ocorrencia = await tx.ocorrencia.findFirst({
        where: { id: parsed.data.ocorrenciaId, colegioId: context.colegioId },
        select: { id: true, colegio: { select: { codigo: true } } },
      });
      if (!ocorrencia) {
        throw new Error("OCORRENCIA_NAO_ENCONTRADA");
      }
      const ano = new Date().getFullYear();
      const sequencial = await proximoNumero(
        tx,
        context.colegioId,
        "SINDICANCIA",
        ano,
      );
      const numero = formatarNumeroSindicancia(
        ocorrencia.colegio.codigo,
        ano,
        sequencial,
      );

      const sindicancia = await tx.sindicancia.create({
        data: {
          ocorrenciaId: ocorrencia.id,
          colegioId: context.colegioId,
          numero,
          sequencial,
          anoNumeracao: ano,
          objeto: parsed.data.objeto,
          sindicanteId: context.usuarioId,
          instauradaPorId: context.usuarioId,
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "SINDICANCIA_INSTAURADA",
          entidade: "sindicancias",
          entidadeId: sindicancia.id,
          dadosNovos: { numero },
          metadata,
        },
        tx,
      );
    });

    revalidatePath(caminho(parsed.data.ocorrenciaId));
    return actionSuccess("Sindicância instaurada.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function atualizarSindicanciaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.SINDICANCIAS_MANAGE);
  const parsed = atualizarSindicanciaSchema.safeParse({
    sindicanciaId: formData.get("sindicanciaId"),
    acao: formData.get("acao"),
    conclusao: formData.get("conclusao") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Dados inválidos.");
  }

  try {
    const sindicancia = await prisma.sindicancia.findFirst({
      where: { id: parsed.data.sindicanciaId, colegioId: context.colegioId },
      select: { id: true, status: true, ocorrenciaId: true },
    });
    if (!sindicancia) {
      return actionError("Sindicância não encontrada.");
    }

    const finalizar =
      parsed.data.acao === "CONCLUIR" || parsed.data.acao === "ARQUIVAR";
    if (finalizar && !podeConcluirSindicancia(sindicancia.status)) {
      return actionError("A sindicância já foi finalizada.");
    }
    if (parsed.data.acao === "ANDAMENTO" && sindicancia.status !== "INSTAURADA") {
      return actionError("A sindicância não está no estado inicial.");
    }
    if (finalizar && !parsed.data.conclusao) {
      return actionError("Informe a conclusão/parecer.");
    }

    const novoStatus =
      parsed.data.acao === "ANDAMENTO"
        ? "EM_ANDAMENTO"
        : parsed.data.acao === "CONCLUIR"
          ? "CONCLUIDA"
          : "ARQUIVADA";

    await prisma.$transaction(async (tx) => {
      await tx.sindicancia.update({
        where: { id: sindicancia.id },
        data: {
          status: novoStatus,
          conclusao: finalizar ? parsed.data.conclusao : undefined,
          concluidaEm: finalizar ? new Date() : undefined,
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "SINDICANCIA_ATUALIZADA",
          entidade: "sindicancias",
          entidadeId: sindicancia.id,
          dadosNovos: { status: novoStatus },
          metadata: await getRequestMetadata(),
        },
        tx,
      );
    });

    revalidatePath(caminho(sindicancia.ocorrenciaId));
    return actionSuccess("Sindicância atualizada.");
  } catch {
    return actionError("Não foi possível atualizar a sindicância.");
  }
}

// --- Conselho disciplinar ---------------------------------------------------

export async function instaurarConselhoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.CONSELHOS_MANAGE);
  const parsed = instaurarConselhoSchema.safeParse({
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId"),
    objeto: formData.get("objeto"),
  });
  if (!parsed.success) {
    return actionError("Descreva o objeto do conselho.");
  }

  try {
    const metadata = await getRequestMetadata();
    const ocorrenciaId = await prisma.$transaction(async (tx) => {
      const processo = await tx.ocorrenciaAluno.findFirst({
        where: {
          id: parsed.data.ocorrenciaAlunoId,
          ocorrencia: { colegioId: context.colegioId },
        },
        select: {
          id: true,
          ocorrenciaId: true,
          ocorrencia: { select: { colegio: { select: { codigo: true } } } },
        },
      });
      if (!processo) {
        throw new Error("PROCESSO_NAO_ENCONTRADO");
      }
      const ano = new Date().getFullYear();
      const sequencial = await proximoNumero(
        tx,
        context.colegioId,
        "CONSELHO",
        ano,
      );
      const numero = formatarNumeroConselho(
        processo.ocorrencia.colegio.codigo,
        ano,
        sequencial,
      );

      const conselho = await tx.conselhoDisciplinar.create({
        data: {
          ocorrenciaAlunoId: processo.id,
          colegioId: context.colegioId,
          numero,
          sequencial,
          anoNumeracao: ano,
          objeto: parsed.data.objeto,
          presididoPorId: context.usuarioId,
          instauradoPorId: context.usuarioId,
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CONSELHO_INSTAURADO",
          entidade: "conselhos_disciplinares",
          entidadeId: conselho.id,
          dadosNovos: { numero },
          metadata,
        },
        tx,
      );
      return processo.ocorrenciaId;
    });

    revalidatePath(caminho(ocorrenciaId));
    return actionSuccess("Conselho disciplinar instaurado.");
  } catch (error) {
    return mapErro(error);
  }
}

export async function registrarParecerConselhoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.CONSELHOS_MANAGE);
  const parsed = parecerConselhoSchema.safeParse({
    conselhoId: formData.get("conselhoId"),
    parecer: formData.get("parecer"),
    recomendacao: formData.get("recomendacao"),
    votosFavor: formData.get("votosFavor") ?? undefined,
    votosContra: formData.get("votosContra") ?? undefined,
  });
  if (!parsed.success) {
    return actionError("Confira o parecer e a recomendação.");
  }

  try {
    const conselho = await prisma.conselhoDisciplinar.findFirst({
      where: { id: parsed.data.conselhoId, colegioId: context.colegioId },
      select: {
        id: true,
        status: true,
        ocorrenciaAluno: { select: { ocorrenciaId: true } },
      },
    });
    if (!conselho) {
      return actionError("Conselho não encontrado.");
    }
    if (!podeConcluirConselho(conselho.status)) {
      return actionError("O conselho já foi concluído.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.conselhoDisciplinar.update({
        where: { id: conselho.id },
        data: {
          status: "CONCLUIDO",
          parecer: parsed.data.parecer,
          recomendacao: parsed.data.recomendacao,
          votosFavor: parsed.data.votosFavor,
          votosContra: parsed.data.votosContra,
          concluidoEm: new Date(),
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "CONSELHO_PARECER",
          entidade: "conselhos_disciplinares",
          entidadeId: conselho.id,
          dadosNovos: {
            recomendacao: parsed.data.recomendacao,
            votos: `${parsed.data.votosFavor}x${parsed.data.votosContra}`,
          },
          metadata: await getRequestMetadata(),
        },
        tx,
      );
    });

    revalidatePath(caminho(conselho.ocorrenciaAluno.ocorrenciaId));
    return actionSuccess("Parecer do conselho registrado.");
  } catch {
    return actionError("Não foi possível registrar o parecer.");
  }
}

function mapErro(error: unknown): ActionState {
  const mensagens: Record<string, string> = {
    PROCESSO_NAO_ENCONTRADO: "Processo não encontrado no colégio ativo.",
    OCORRENCIA_NAO_ENCONTRADA: "Ocorrência não encontrada no colégio ativo.",
  };
  if (error instanceof Error && mensagens[error.message]) {
    return actionError(mensagens[error.message]);
  }
  return actionError("Não foi possível concluir a operação.");
}
