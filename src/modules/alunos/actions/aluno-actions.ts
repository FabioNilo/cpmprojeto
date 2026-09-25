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
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import {
  createAlunoSchema,
  transferAlunoSchema,
  updateAlunoSchema,
  updateAlunoVinculoStatusSchema,
} from "../schemas/aluno-schema";

export async function createAlunoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ALUNOS_MANAGE);
  const parsed = createAlunoSchema.safeParse({
    nome: formData.get("nome"),
    matriculaGeral: formData.get("matriculaGeral"),
    turmaId: formData.get("turmaId"),
    numero: formData.get("numero"),
    necessidadeEspecial: formData.get("necessidadeEspecial") ?? undefined,
  });

  if (!parsed.success) {
    return actionError("Confira os dados do aluno.");
  }

  try {
    const metadata = await getRequestMetadata();
    const aluno = await prisma.$transaction(async (tx) => {
      const existingAluno = parsed.data.matriculaGeral
        ? await tx.aluno.findUnique({
            where: { matriculaGeral: parsed.data.matriculaGeral },
          })
        : null;

      const savedAluno =
        existingAluno ??
        (await tx.aluno.create({
          data: {
            nome: parsed.data.nome,
            matriculaGeral: parsed.data.matriculaGeral,
            necessidadeEspecial: parsed.data.necessidadeEspecial,
          },
        }));

      const vinculo = await tx.alunoVinculoColegio.upsert({
        where: {
          alunoId_colegioId: {
            alunoId: savedAluno.id,
            colegioId: context.colegioId,
          },
        },
        update: {
          status: "ATIVO",
          dataSaida: null,
          motivoSaida: null,
        },
        create: {
          alunoId: savedAluno.id,
          colegioId: context.colegioId,
          status: "ATIVO",
          dataEntrada: new Date(),
        },
      });

      if (parsed.data.turmaId) {
        const turma = await tx.turma.findFirst({
          where: {
            id: parsed.data.turmaId,
            colegioId: context.colegioId,
            ativa: true,
          },
          select: {
            id: true,
            anoLetivoId: true,
          },
        });

        if (!turma) {
          throw new Error("TURMA_INVALIDA");
        }

        await tx.matricula.upsert({
          where: {
            alunoId_colegioId_anoLetivoId: {
              alunoId: savedAluno.id,
              colegioId: context.colegioId,
              anoLetivoId: turma.anoLetivoId,
            },
          },
          update: {
            turmaId: turma.id,
            alunoVinculoColegioId: vinculo.id,
            numero: parsed.data.numero,
            ativa: true,
          },
          create: {
            alunoId: savedAluno.id,
            colegioId: context.colegioId,
            alunoVinculoColegioId: vinculo.id,
            turmaId: turma.id,
            anoLetivoId: turma.anoLetivoId,
            numero: parsed.data.numero,
          },
        });
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: existingAluno ? "VINCULO_ALUNO_COLEGIO" : "CRIACAO_ALUNO",
          entidade: "alunos",
          entidadeId: savedAluno.id,
          dadosNovos: {
            nome: savedAluno.nome,
            matriculaGeral: savedAluno.matriculaGeral,
            colegioId: context.colegioId,
          },
          metadata,
        },
        tx,
      );

      return savedAluno;
    });

    revalidatePath("/alunos");
    return actionSuccess(`Aluno ${aluno.nome} salvo.`);
  } catch (error) {
    if (error instanceof Error && error.message === "TURMA_INVALIDA") {
      return actionError("Turma inválida para o colégio ativo.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe aluno com essa matrícula geral.");
    }

    return actionError("Não foi possível salvar o aluno.");
  }
}

export async function updateAlunoVinculoStatusAction(
  formData: FormData,
): Promise<void> {
  const context = await requirePermission(PERMISSIONS.ALUNOS_MANAGE);
  const parsed = updateAlunoVinculoStatusSchema.safeParse({
    vinculoId: formData.get("vinculoId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  const dataSaida = parsed.data.status === "ATIVO" ? null : new Date();

  const vinculo = await prisma.alunoVinculoColegio.update({
    where: {
      id: parsed.data.vinculoId,
      colegioId: context.colegioId,
    },
    data: {
      status: parsed.data.status,
      dataSaida,
    },
  });

  await registerAudit({
    usuarioId: context.usuarioId,
    colegioId: context.colegioId,
    acao: "ALTERACAO_VINCULO_ALUNO_COLEGIO",
    entidade: "aluno_vinculos_colegio",
    entidadeId: vinculo.id,
    dadosNovos: {
      status: vinculo.status,
    },
    metadata: await getRequestMetadata(),
  });

  revalidatePath("/alunos");
}

export async function updateAlunoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ALUNOS_MANAGE);
  const parsed = updateAlunoSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    matriculaGeral: formData.get("matriculaGeral"),
    necessidadeEspecial: formData.get("necessidadeEspecial") ?? undefined,
  });

  if (!parsed.success) {
    return actionError("Confira os dados do aluno.");
  }

  try {
    const metadata = await getRequestMetadata();
    const aluno = await prisma.$transaction(async (tx) => {
      const previous = await tx.aluno.findFirst({
        where: {
          id: parsed.data.id,
          vinculosColegio: {
            some: {
              colegioId: context.colegioId,
            },
          },
        },
        select: {
          id: true,
          nome: true,
          matriculaGeral: true,
          necessidadeEspecial: true,
        },
      });

      if (!previous) {
        throw new Error("ALUNO_FORA_DO_COLEGIO");
      }

      const updated = await tx.aluno.update({
        where: { id: previous.id },
        data: {
          nome: parsed.data.nome,
          matriculaGeral: parsed.data.matriculaGeral,
          necessidadeEspecial: parsed.data.necessidadeEspecial,
        },
      });

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "ALTERACAO_ALUNO",
          entidade: "alunos",
          entidadeId: updated.id,
          dadosAnteriores: previous,
          dadosNovos: {
            nome: updated.nome,
            matriculaGeral: updated.matriculaGeral,
            necessidadeEspecial: updated.necessidadeEspecial,
          },
          metadata,
        },
        tx,
      );

      return updated;
    });

    revalidatePath("/alunos");
    return actionSuccess(`Aluno ${aluno.nome} atualizado.`);
  } catch (error) {
    if (error instanceof Error && error.message === "ALUNO_FORA_DO_COLEGIO") {
      return actionError("Aluno nao pertence ao colegio ativo.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError("Já existe aluno com essa matrícula geral.");
    }

    return actionError("Não foi possível atualizar o aluno.");
  }
}

export async function transferAlunoAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.ALUNOS_TRANSFER);
  const parsed = transferAlunoSchema.safeParse({
    alunoId: formData.get("alunoId"),
    destinoColegioId: formData.get("destinoColegioId"),
    destinoTurmaId: formData.get("destinoTurmaId"),
    numero: formData.get("numero"),
    dataTransferencia: formData.get("dataTransferencia"),
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return actionError("Confira os dados da transferencia.");
  }

  if (parsed.data.destinoColegioId === context.colegioId) {
    return actionError("O CPM de destino deve ser diferente do CPM de origem.");
  }

  try {
    const metadata = await getRequestMetadata();
    const result = await prisma.$transaction(async (tx) => {
      const vinculoOrigem = await tx.alunoVinculoColegio.findFirst({
        where: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          status: "ATIVO",
        },
        select: {
          id: true,
          alunoId: true,
          aluno: {
            select: {
              id: true,
              nome: true,
              matriculaGeral: true,
              responsaveis: {
                select: {
                  responsavelId: true,
                  responsavel: {
                    select: {
                      usuarioId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!vinculoOrigem) {
        throw new Error("ALUNO_NAO_ATIVO_ORIGEM");
      }

      const [colegioDestino, outroVinculoAtivo, vinculoDestinoAtual] =
        await Promise.all([
          tx.colegio.findFirst({
            where: {
              id: parsed.data.destinoColegioId,
              ativo: true,
            },
            select: {
              id: true,
              nome: true,
              codigo: true,
            },
          }),
          tx.alunoVinculoColegio.findFirst({
            where: {
              alunoId: parsed.data.alunoId,
              colegioId: {
                not: context.colegioId,
              },
              status: "ATIVO",
            },
            select: {
              colegioId: true,
            },
          }),
          tx.alunoVinculoColegio.findUnique({
            where: {
              alunoId_colegioId: {
                alunoId: parsed.data.alunoId,
                colegioId: parsed.data.destinoColegioId,
              },
            },
            select: {
              status: true,
            },
          }),
        ]);

      if (!colegioDestino) {
        throw new Error("COLEGIO_DESTINO_INVALIDO");
      }

      if (outroVinculoAtivo) {
        throw new Error(
          outroVinculoAtivo.colegioId === parsed.data.destinoColegioId
            ? "ALUNO_JA_ATIVO_DESTINO"
            : "ALUNO_ATIVO_EM_OUTRO_COLEGIO",
        );
      }

      if (vinculoDestinoAtual?.status === "ATIVO") {
        throw new Error("ALUNO_JA_ATIVO_DESTINO");
      }

      const turmaDestino = parsed.data.destinoTurmaId
        ? await tx.turma.findFirst({
            where: {
              id: parsed.data.destinoTurmaId,
              colegioId: parsed.data.destinoColegioId,
              ativa: true,
              anoLetivo: {
                ativo: true,
              },
            },
            select: {
              id: true,
              nome: true,
              anoLetivoId: true,
              anoLetivo: {
                select: {
                  ano: true,
                },
              },
            },
          })
        : null;

      if (parsed.data.destinoTurmaId && !turmaDestino) {
        throw new Error("TURMA_DESTINO_INVALIDA");
      }

      await tx.alunoVinculoColegio.update({
        where: {
          id: vinculoOrigem.id,
        },
        data: {
          status: "TRANSFERIDO",
          dataSaida: parsed.data.dataTransferencia,
          motivoSaida: parsed.data.motivo,
        },
      });

      await tx.matricula.updateMany({
        where: {
          alunoId: parsed.data.alunoId,
          colegioId: context.colegioId,
          ativa: true,
        },
        data: {
          ativa: false,
        },
      });

      const vinculoDestino = await tx.alunoVinculoColegio.upsert({
        where: {
          alunoId_colegioId: {
            alunoId: parsed.data.alunoId,
            colegioId: parsed.data.destinoColegioId,
          },
        },
        update: {
          status: "ATIVO",
          dataEntrada: parsed.data.dataTransferencia,
          dataSaida: null,
          motivoSaida: null,
        },
        create: {
          alunoId: parsed.data.alunoId,
          colegioId: parsed.data.destinoColegioId,
          status: "ATIVO",
          dataEntrada: parsed.data.dataTransferencia,
        },
      });

      if (turmaDestino) {
        await tx.matricula.upsert({
          where: {
            alunoId_colegioId_anoLetivoId: {
              alunoId: parsed.data.alunoId,
              colegioId: parsed.data.destinoColegioId,
              anoLetivoId: turmaDestino.anoLetivoId,
            },
          },
          update: {
            turmaId: turmaDestino.id,
            alunoVinculoColegioId: vinculoDestino.id,
            numero: parsed.data.numero,
            ativa: true,
          },
          create: {
            alunoId: parsed.data.alunoId,
            colegioId: parsed.data.destinoColegioId,
            alunoVinculoColegioId: vinculoDestino.id,
            turmaId: turmaDestino.id,
            anoLetivoId: turmaDestino.anoLetivoId,
            numero: parsed.data.numero,
          },
        });
      }

      const perfilResponsavel = await tx.perfil.findUniqueOrThrow({
        where: { codigo: ROLE_CODES.RESPONSAVEL },
        select: { id: true },
      });

      for (const alunoResponsavel of vinculoOrigem.aluno.responsaveis) {
        const responsavelUsuarioId = alunoResponsavel.responsavel.usuarioId;

        const responsavelDestinoVinculo = await tx.usuarioColegio.upsert({
          where: {
            usuarioId_colegioId: {
              usuarioId: responsavelUsuarioId,
              colegioId: parsed.data.destinoColegioId,
            },
          },
          update: { ativo: true },
          create: {
            usuarioId: responsavelUsuarioId,
            colegioId: parsed.data.destinoColegioId,
          },
        });

        await tx.usuarioColegioPerfil.upsert({
          where: {
            usuarioColegioId_perfilId: {
              usuarioColegioId: responsavelDestinoVinculo.id,
              perfilId: perfilResponsavel.id,
            },
          },
          update: {},
          create: {
            usuarioColegioId: responsavelDestinoVinculo.id,
            perfilId: perfilResponsavel.id,
          },
        });

        const outroAlunoAtivoNaOrigem = await tx.alunoResponsavel.findFirst({
          where: {
            responsavelId: alunoResponsavel.responsavelId,
            alunoId: {
              not: parsed.data.alunoId,
            },
            aluno: {
              vinculosColegio: {
                some: {
                  colegioId: context.colegioId,
                  status: "ATIVO",
                },
              },
            },
          },
          select: {
            alunoId: true,
          },
        });

        if (!outroAlunoAtivoNaOrigem) {
          const responsavelOrigemVinculo = await tx.usuarioColegio.findUnique({
            where: {
              usuarioId_colegioId: {
                usuarioId: responsavelUsuarioId,
                colegioId: context.colegioId,
              },
            },
            select: {
              id: true,
              perfis: {
                select: {
                  perfilId: true,
                  perfil: {
                    select: {
                      codigo: true,
                    },
                  },
                },
              },
            },
          });

          const hasOnlyResponsavelProfile =
            responsavelOrigemVinculo?.perfis.length === 1 &&
            responsavelOrigemVinculo.perfis[0]?.perfil.codigo ===
              ROLE_CODES.RESPONSAVEL;

          if (responsavelOrigemVinculo && hasOnlyResponsavelProfile) {
            await tx.usuarioColegio.update({
              where: {
                id: responsavelOrigemVinculo.id,
              },
              data: {
                ativo: false,
              },
            });
          } else if (responsavelOrigemVinculo) {
            await tx.usuarioColegioPerfil.deleteMany({
              where: {
                usuarioColegioId: responsavelOrigemVinculo.id,
                perfilId: perfilResponsavel.id,
              },
            });
          }
        }
      }

      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "TRANSFERENCIA_ALUNO_CPM",
          entidade: "alunos",
          entidadeId: parsed.data.alunoId,
          dadosAnteriores: {
            colegioId: context.colegioId,
            colegioNome: context.colegioNome,
            status: "ATIVO",
          },
          dadosNovos: {
            colegioId: colegioDestino.id,
            colegioNome: colegioDestino.nome,
            colegioCodigo: colegioDestino.codigo,
            status: "ATIVO",
            matriculaGeral: vinculoOrigem.aluno.matriculaGeral,
            turmaId: turmaDestino?.id,
            turmaNome: turmaDestino?.nome,
            anoLetivo: turmaDestino?.anoLetivo.ano,
            dataTransferencia: parsed.data.dataTransferencia.toISOString(),
          },
          metadata,
        },
        tx,
      );

      return {
        alunoNome: vinculoOrigem.aluno.nome,
        colegioDestinoCodigo: colegioDestino.codigo,
      };
    });

    revalidatePath("/alunos");
    revalidatePath("/responsaveis");
    return actionSuccess(
      `Aluno ${result.alunoNome} transferido para ${result.colegioDestinoCodigo}.`,
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ALUNO_NAO_ATIVO_ORIGEM") {
      return actionError("Aluno nao esta ativo no CPM de origem.");
    }

    if (
      error instanceof Error &&
      error.message === "COLEGIO_DESTINO_INVALIDO"
    ) {
      return actionError("CPM de destino inválido ou inativo.");
    }

    if (error instanceof Error && error.message === "ALUNO_JA_ATIVO_DESTINO") {
      return actionError("Aluno ja esta ativo no CPM de destino.");
    }

    if (
      error instanceof Error &&
      error.message === "ALUNO_ATIVO_EM_OUTRO_COLEGIO"
    ) {
      return actionError(
        "Aluno já possui outro vínculo ativo em CPM distinto.",
      );
    }

    if (error instanceof Error && error.message === "TURMA_DESTINO_INVALIDA") {
      return actionError("Turma de destino inválida para o CPM escolhido.");
    }

    if (isUniqueConstraintError(error)) {
      return actionError(
        "Já existe matrícula ativa para esse aluno no destino.",
      );
    }

    return actionError("Não foi possível transferir o aluno.");
  }
}
