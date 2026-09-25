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

import { enviarAvisoManualSchema } from "../schemas/notificacao-schemas";

export async function enviarAvisoManualAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.RESPONSAVEIS_MANAGE);
  const parsed = enviarAvisoManualSchema.safeParse({
    responsavelId: formData.get("responsavelId"),
    titulo: formData.get("titulo"),
    mensagem: formData.get("mensagem"),
  });

  if (!parsed.success) {
    return actionError("Confira o título e a mensagem do aviso.");
  }

  try {
    const metadata = await getRequestMetadata();
    await prisma.$transaction(async (tx) => {
      const responsavel = await tx.responsavel.findFirst({
        where: {
          id: parsed.data.responsavelId,
          alunos: {
            some: {
              aluno: {
                vinculosColegio: { some: { colegioId: context.colegioId } },
              },
            },
          },
        },
        select: { id: true },
      });

      if (!responsavel) {
        throw new Error("RESPONSAVEL_FORA_DO_COLEGIO");
      }

      const criada = await tx.notificacaoResponsavel.create({
        data: {
          responsavelId: responsavel.id,
          colegioId: context.colegioId,
          tipo: "AVISO_ESCOLA",
          titulo: parsed.data.titulo,
          mensagem: parsed.data.mensagem,
          criadoPorId: context.usuarioId,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ENVIO_AVISO_RESPONSAVEL",
          entidade: "notificacoes_responsavel",
          entidadeId: criada.id,
          dadosNovos: { titulo: criada.titulo },
          metadata,
        },
        tx,
      );
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RESPONSAVEL_FORA_DO_COLEGIO") {
      return actionError("Responsável não pertence ao colégio ativo.");
    }
    return actionError("Não foi possível enviar o aviso.");
  }

  revalidatePath("/responsaveis");
  return actionSuccess("Aviso enviado.");
}
