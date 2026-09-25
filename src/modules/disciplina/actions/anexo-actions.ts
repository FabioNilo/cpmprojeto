"use server";

import { createHash, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import {
  removerObjeto,
  storageConfigurado,
  uploadObjeto,
} from "@/lib/storage/supabase-storage";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  anexoIdSchema,
  CONTENT_TYPES_PERMITIDOS,
  enviarAnexoSchema,
  TAMANHO_MAX_ANEXO,
} from "../schemas/anexo-schemas";

function nomeSeguro(nome: string): string {
  return nome
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "arquivo";
}

export async function enviarAnexoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ANEXOS_MANAGE);

  if (!storageConfigurado()) {
    return actionError(
      "Object storage nao configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
    );
  }

  const parsed = enviarAnexoSchema.safeParse({
    ocorrenciaId: formData.get("ocorrenciaId") || undefined,
    ocorrenciaAlunoId: formData.get("ocorrenciaAlunoId") || undefined,
    categoria: formData.get("categoria") || undefined,
  });
  if (!parsed.success) {
    return actionError("Dados do anexo inválidos.");
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return actionError("Selecione um arquivo.");
  }
  if (arquivo.size > TAMANHO_MAX_ANEXO) {
    return actionError("Arquivo acima de 10 MB.");
  }
  if (!CONTENT_TYPES_PERMITIDOS.includes(arquivo.type)) {
    return actionError("Tipo de arquivo nao permitido.");
  }

  try {
    // Escopo: a ocorrencia/processo tem que ser do colegio ativo.
    let ocorrenciaId = parsed.data.ocorrenciaId ?? null;
    if (parsed.data.ocorrenciaAlunoId) {
      const processo = await prisma.ocorrenciaAluno.findFirst({
        where: {
          id: parsed.data.ocorrenciaAlunoId,
          ocorrencia: { colegioId: context.colegioId },
        },
        select: { ocorrenciaId: true },
      });
      if (!processo) {
        return actionError("Processo nao encontrado no colegio ativo.");
      }
      ocorrenciaId = processo.ocorrenciaId;
    } else if (ocorrenciaId) {
      const ocorrencia = await prisma.ocorrencia.findFirst({
        where: { id: ocorrenciaId, colegioId: context.colegioId },
        select: { id: true },
      });
      if (!ocorrencia) {
        return actionError("Ocorrencia nao encontrada no colegio ativo.");
      }
    }

    const buffer = await arquivo.arrayBuffer();
    const hash = createHash("sha256")
      .update(new Uint8Array(buffer))
      .digest("hex");
    const safe = nomeSeguro(arquivo.name);
    const storagePath = `${context.colegioId}/${
      ocorrenciaId ?? "geral"
    }/${randomUUID()}-${safe}`;

    await uploadObjeto(storagePath, buffer, arquivo.type);

    const metadata = await getRequestMetadata();
    const anexo = await prisma.$transaction(async (tx) => {
      const criado = await tx.anexo.create({
        data: {
          colegioId: context.colegioId,
          ocorrenciaId,
          ocorrenciaAlunoId: parsed.data.ocorrenciaAlunoId ?? null,
          categoria: parsed.data.categoria,
          origem: "UPLOAD",
          nomeArquivo: safe,
          contentType: arquivo.type,
          tamanhoBytes: arquivo.size,
          storagePath,
          hash,
          enviadoPorId: context.usuarioId,
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ENVIO_ANEXO",
          entidade: "anexos",
          entidadeId: criado.id,
          dadosNovos: { nome: safe, categoria: parsed.data.categoria, hash },
          metadata,
        },
        tx,
      );
      return criado;
    });

    if (anexo.ocorrenciaId) {
      revalidatePath(`/disciplina/ocorrencias/${anexo.ocorrenciaId}`);
    }
    return actionSuccess("Anexo enviado.");
  } catch {
    return actionError("Não foi possível enviar o anexo.");
  }
}

export async function removerAnexoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ANEXOS_MANAGE);
  const parsed = anexoIdSchema.safeParse({ anexoId: formData.get("anexoId") });
  if (!parsed.success) {
    return actionError("Anexo inválido.");
  }

  try {
    const anexo = await prisma.anexo.findFirst({
      where: {
        id: parsed.data.anexoId,
        colegioId: context.colegioId,
        removidoEm: null,
      },
      select: { id: true, storagePath: true, ocorrenciaId: true },
    });
    if (!anexo) {
      return actionError("Anexo nao encontrado.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.anexo.update({
        where: { id: anexo.id },
        data: { removidoEm: new Date() },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "REMOCAO_ANEXO",
          entidade: "anexos",
          entidadeId: anexo.id,
          metadata: await getRequestMetadata(),
        },
        tx,
      );
    });

    // Best-effort: remover o binario do bucket.
    try {
      await removerObjeto(anexo.storagePath);
    } catch {
      // O metadado ja esta marcado como removido; ignorar falha do bucket.
    }

    if (anexo.ocorrenciaId) {
      revalidatePath(`/disciplina/ocorrencias/${anexo.ocorrenciaId}`);
    }
    return actionSuccess("Anexo removido.");
  } catch {
    return actionError("Não foi possível remover o anexo.");
  }
}
