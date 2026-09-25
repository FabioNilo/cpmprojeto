"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";

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

import {
  createItemSimplesSchema,
  createTipoElogioSchema,
  createTransgressaoSchema,
  toggleCatalogoSchema,
  updateItemSimplesSchema,
  updateTipoElogioSchema,
  updateTransgressaoSchema,
} from "../schemas/catalogo-schemas";

const CAMINHO = "/disciplina/catalogos";

async function auditar(
  contextUsuarioId: string,
  contextColegioId: string,
  acao: string,
  entidade: string,
  entidadeId: string,
  dadosNovos: Prisma.InputJsonObject,
) {
  await registerAudit({
    usuarioId: contextUsuarioId,
    colegioId: contextColegioId,
    acao,
    entidade,
    entidadeId,
    dadosNovos,
    metadata: await getRequestMetadata(),
  });
}

// --------------------------------------------------------------------------
// Transgressoes
// --------------------------------------------------------------------------

export async function createTransgressaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = createTransgressaoSchema.safeParse({
    codigo: formData.get("codigo"),
    descricao: formData.get("descricao"),
    natureza: formData.get("natureza"),
    baseLegal: formData.get("baseLegal"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da transgressão.");
  }

  try {
    const criada = await prisma.transgressao.create({ data: parsed.data });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "CRIACAO_TRANSGRESSAO",
      "transgressoes",
      criada.id,
      { codigo: criada.codigo, natureza: criada.natureza },
    );
    revalidatePath(CAMINHO);
    return actionSuccess(`Transgressão ${criada.codigo} criada.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe transgressão com esse código.");
    }
    return actionError("Não foi possível criar a transgressão.");
  }
}

export async function updateTransgressaoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = updateTransgressaoSchema.safeParse({
    id: formData.get("id"),
    descricao: formData.get("descricao"),
    natureza: formData.get("natureza"),
    baseLegal: formData.get("baseLegal"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da transgressão.");
  }

  const { id, ...dados } = parsed.data;
  try {
    const atualizada = await prisma.transgressao.update({
      where: { id },
      data: dados,
    });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "ALTERACAO_TRANSGRESSAO",
      "transgressoes",
      atualizada.id,
      { descricao: atualizada.descricao, natureza: atualizada.natureza },
    );
    revalidatePath(CAMINHO);
    return actionSuccess(`Transgressão ${atualizada.codigo} atualizada.`);
  } catch {
    return actionError("Não foi possível atualizar a transgressão.");
  }
}

export async function toggleTransgressaoAction(
  formData: FormData,
): Promise<void> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = toggleCatalogoSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });
  if (!parsed.success) {
    return;
  }
  const registro = await prisma.transgressao.update({
    where: { id: parsed.data.id },
    data: { ativo: parsed.data.ativo },
  });
  await auditar(
    context.usuarioId,
    context.colegioId,
    "ALTERACAO_TRANSGRESSAO",
    "transgressoes",
    registro.id,
    { ativo: registro.ativo },
  );
  revalidatePath(CAMINHO);
}

// --------------------------------------------------------------------------
// Atenuantes
// --------------------------------------------------------------------------

export async function createAtenuanteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = createItemSimplesSchema.safeParse({
    codigo: formData.get("codigo"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do atenuante.");
  }
  try {
    const criado = await prisma.atenuante.create({ data: parsed.data });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "CRIACAO_ATENUANTE",
      "atenuantes",
      criado.id,
      { codigo: criado.codigo },
    );
    revalidatePath(CAMINHO);
    return actionSuccess(`Atenuante ${criado.codigo} criado.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe atenuante com esse código.");
    }
    return actionError("Não foi possível criar o atenuante.");
  }
}

export async function updateAtenuanteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = updateItemSimplesSchema.safeParse({
    id: formData.get("id"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do atenuante.");
  }
  try {
    const atualizado = await prisma.atenuante.update({
      where: { id: parsed.data.id },
      data: { descricao: parsed.data.descricao },
    });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "ALTERACAO_ATENUANTE",
      "atenuantes",
      atualizado.id,
      { descricao: atualizado.descricao },
    );
    revalidatePath(CAMINHO);
    return actionSuccess(`Atenuante ${atualizado.codigo} atualizado.`);
  } catch {
    return actionError("Não foi possível atualizar o atenuante.");
  }
}

export async function toggleAtenuanteAction(formData: FormData): Promise<void> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = toggleCatalogoSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });
  if (!parsed.success) {
    return;
  }
  const registro = await prisma.atenuante.update({
    where: { id: parsed.data.id },
    data: { ativo: parsed.data.ativo },
  });
  await auditar(
    context.usuarioId,
    context.colegioId,
    "ALTERACAO_ATENUANTE",
    "atenuantes",
    registro.id,
    { ativo: registro.ativo },
  );
  revalidatePath(CAMINHO);
}

// --------------------------------------------------------------------------
// Agravantes
// --------------------------------------------------------------------------

export async function createAgravanteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = createItemSimplesSchema.safeParse({
    codigo: formData.get("codigo"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do agravante.");
  }
  try {
    const criado = await prisma.agravante.create({ data: parsed.data });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "CRIACAO_AGRAVANTE",
      "agravantes",
      criado.id,
      { codigo: criado.codigo },
    );
    revalidatePath(CAMINHO);
    return actionSuccess(`Agravante ${criado.codigo} criado.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe agravante com esse código.");
    }
    return actionError("Não foi possível criar o agravante.");
  }
}

export async function updateAgravanteAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = updateItemSimplesSchema.safeParse({
    id: formData.get("id"),
    descricao: formData.get("descricao"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do agravante.");
  }
  try {
    const atualizado = await prisma.agravante.update({
      where: { id: parsed.data.id },
      data: { descricao: parsed.data.descricao },
    });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "ALTERACAO_AGRAVANTE",
      "agravantes",
      atualizado.id,
      { descricao: atualizado.descricao },
    );
    revalidatePath(CAMINHO);
    return actionSuccess(`Agravante ${atualizado.codigo} atualizado.`);
  } catch {
    return actionError("Não foi possível atualizar o agravante.");
  }
}

export async function toggleAgravanteAction(formData: FormData): Promise<void> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = toggleCatalogoSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });
  if (!parsed.success) {
    return;
  }
  const registro = await prisma.agravante.update({
    where: { id: parsed.data.id },
    data: { ativo: parsed.data.ativo },
  });
  await auditar(
    context.usuarioId,
    context.colegioId,
    "ALTERACAO_AGRAVANTE",
    "agravantes",
    registro.id,
    { ativo: registro.ativo },
  );
  revalidatePath(CAMINHO);
}

// --------------------------------------------------------------------------
// Tipos de elogio
// --------------------------------------------------------------------------

export async function createTipoElogioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = createTipoElogioSchema.safeParse({
    codigo: formData.get("codigo"),
    nome: formData.get("nome"),
    valorPontos: formData.get("valorPontos"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do tipo de elogio.");
  }
  try {
    const criado = await prisma.tipoElogio.create({ data: parsed.data });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "CRIACAO_TIPO_ELOGIO",
      "tipos_elogio",
      criado.id,
      { codigo: criado.codigo, valorPontos: criado.valorPontos.toString() },
    );
    revalidatePath(CAMINHO);
    revalidateTag("tipos-elogio");
    return actionSuccess(`Tipo de elogio ${criado.codigo} criado.`);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return actionError("Já existe tipo de elogio com esse código.");
    }
    return actionError("Não foi possível criar o tipo de elogio.");
  }
}

export async function updateTipoElogioAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = updateTipoElogioSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    valorPontos: formData.get("valorPontos"),
  });
  if (!parsed.success) {
    return actionError("Confira os dados do tipo de elogio.");
  }
  const { id, ...dados } = parsed.data;
  try {
    const atualizado = await prisma.tipoElogio.update({
      where: { id },
      data: dados,
    });
    await auditar(
      context.usuarioId,
      context.colegioId,
      "ALTERACAO_TIPO_ELOGIO",
      "tipos_elogio",
      atualizado.id,
      { nome: atualizado.nome, valorPontos: atualizado.valorPontos.toString() },
    );
    revalidatePath(CAMINHO);
    revalidateTag("tipos-elogio");
    return actionSuccess(`Tipo de elogio ${atualizado.codigo} atualizado.`);
  } catch {
    return actionError("Não foi possível atualizar o tipo de elogio.");
  }
}

export async function toggleTipoElogioAction(
  formData: FormData,
): Promise<void> {
  const context = await requirePermission(
    PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
  );
  const parsed = toggleCatalogoSchema.safeParse({
    id: formData.get("id"),
    ativo: formData.get("ativo"),
  });
  if (!parsed.success) {
    return;
  }
  const registro = await prisma.tipoElogio.update({
    where: { id: parsed.data.id },
    data: { ativo: parsed.data.ativo },
  });
  await auditar(
    context.usuarioId,
    context.colegioId,
    "ALTERACAO_TIPO_ELOGIO",
    "tipos_elogio",
    registro.id,
    { ativo: registro.ativo },
  );
  revalidatePath(CAMINHO);
  revalidateTag("tipos-elogio");
}
