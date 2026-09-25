import "server-only";

import { prisma } from "@/db/prisma";

// Filhos do responsavel (por usuario logado) no colegio ativo + seus processos.
export async function listFilhosComProcessos(
  usuarioId: string,
  colegioId: string,
) {
  const vinculos = await prisma.alunoResponsavel.findMany({
    where: {
      responsavel: { usuarioId },
      aluno: { vinculosColegio: { some: { colegioId } } },
    },
    select: {
      parentesco: true,
      aluno: {
        select: {
          id: true,
          nome: true,
          matriculaGeral: true,
          ocorrencias: {
            where: {
              ocorrencia: {
                colegioId,
                status: { not: "RASCUNHO" },
              },
            },
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              numeroProcesso: true,
              status: true,
              ocorrencia: {
                select: {
                  tipo: true,
                  status: true,
                  dataOcorrencia: true,
                  descricao: true,
                },
              },
              _count: { select: { manifestacoes: true, ciencias: true } },
            },
          },
        },
      },
    },
  });

  return vinculos.map((v) => ({
    parentesco: v.parentesco,
    aluno: v.aluno,
  }));
}

export async function getProcessoDoFilho(
  processoId: string,
  usuarioId: string,
  colegioId: string,
) {
  return prisma.ocorrenciaAluno.findFirst({
    where: {
      id: processoId,
      ocorrencia: { colegioId },
      aluno: { responsaveis: { some: { responsavel: { usuarioId } } } },
    },
    select: {
      id: true,
      numeroProcesso: true,
      status: true,
      manifestacaoAcolhida: true,
      parecerManifestacao: true,
      aluno: { select: { nome: true, matriculaGeral: true } },
      ocorrencia: {
        select: {
          tipo: true,
          status: true,
          dataOcorrencia: true,
          local: true,
          descricao: true,
        },
      },
      manifestacoes: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          tipo: true,
          texto: true,
          createdAt: true,
          autor: { select: { nome: true } },
        },
      },
      ciencias: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sobre: true,
          meio: true,
          createdAt: true,
        },
      },
      decisoes: {
        where: { revogadoEm: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          resultado: true,
          naturezaApurada: true,
          sancaoTipoCodigo: true,
          diasSancao: true,
          fundamentacao: true,
          numero: true,
        },
      },
      sancoes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          tipoSancaoCodigo: true,
          dias: true,
          status: true,
          numeroPublicacao: true,
          aplicadaEm: true,
          reconsideracoes: {
            orderBy: { createdAt: "desc" },
            select: { id: true, status: true, prazoFinal: true },
          },
        },
      },
    },
  });
}

// Guardas de autorizacao usadas nas Server Actions compartilhadas.
export async function ehResponsavelDoProcesso(
  usuarioId: string,
  ocorrenciaAlunoId: string,
): Promise<boolean> {
  const n = await prisma.ocorrenciaAluno.count({
    where: {
      id: ocorrenciaAlunoId,
      aluno: { responsaveis: { some: { responsavel: { usuarioId } } } },
    },
  });
  return n > 0;
}

export async function ehResponsavelDaSancao(
  usuarioId: string,
  sancaoId: string,
): Promise<boolean> {
  const n = await prisma.sancao.count({
    where: {
      id: sancaoId,
      ocorrenciaAluno: {
        aluno: { responsaveis: { some: { responsavel: { usuarioId } } } },
      },
    },
  });
  return n > 0;
}
