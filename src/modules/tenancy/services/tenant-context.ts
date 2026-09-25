import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { prisma } from "@/db/prisma";
import { requireSession } from "@/modules/auth/services/session-service";

import { TERMO_RESPONSAVEL_VERSAO } from "@/modules/responsaveis/termo";

export type TenantContext = {
  usuarioId: string;
  colegioId: string;
  colegioNome: string;
  perfis: string[];
  permissoes: string[];
  // Portal do responsavel.
  ehResponsavel: boolean;
  onboardingPendente: boolean;
};

export const getTenantContext = cache(async (): Promise<TenantContext> => {
  const session = await requireSession();
  const vinculo = await prisma.usuarioColegio.findUnique({
    where: {
      usuarioId_colegioId: {
        usuarioId: session.usuarioId,
        colegioId: session.colegioAtivoId,
      },
    },
    include: {
      usuario: {
        select: {
          mudarSenhaObrigatoria: true,
          termoResponsavelAceitoEm: true,
          termoResponsavelVersao: true,
          responsavel: { select: { id: true } },
        },
      },
      perfis: {
        include: {
          perfil: {
            include: {
              permissoes: {
                include: {
                  permissao: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!vinculo || !vinculo.ativo) {
    redirect("/login");
  }

  const ehResponsavel = vinculo.usuario.responsavel !== null;
  const termoOk =
    vinculo.usuario.termoResponsavelAceitoEm !== null &&
    vinculo.usuario.termoResponsavelVersao === TERMO_RESPONSAVEL_VERSAO;
  const onboardingPendente =
    ehResponsavel && (vinculo.usuario.mudarSenhaObrigatoria || !termoOk);

  const perfis = vinculo.perfis.map(
    (usuarioColegioPerfil) => usuarioColegioPerfil.perfil.codigo,
  );
  const permissoes = new Set<string>();

  for (const usuarioColegioPerfil of vinculo.perfis) {
    for (const perfilPermissao of usuarioColegioPerfil.perfil.permissoes) {
      permissoes.add(perfilPermissao.permissao.codigo);
    }
  }

  return {
    usuarioId: session.usuarioId,
    colegioId: session.colegioAtivoId,
    colegioNome: session.colegioAtivo.nome,
    perfis,
    permissoes: [...permissoes],
    ehResponsavel,
    onboardingPendente,
  };
});
