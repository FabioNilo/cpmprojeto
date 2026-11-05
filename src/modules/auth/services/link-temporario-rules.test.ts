import { describe, expect, it } from "vitest";

import { ROLE_CODES } from "@/modules/rbac/permissions";

import {
  bloqueioLinkTemporario,
  expiracaoLinkTemporario,
  tokenRecuperacaoVigente,
  type AlvoLinkTemporario,
} from "./link-temporario-rules";

const DIRETOR = [ROLE_CODES.DIRETOR_PM];
const ADMIN = [ROLE_CODES.ADMINISTRADOR];

const equipe: AlvoLinkTemporario = {
  ativo: true,
  vinculoAtivoNoColegio: true,
  ehResponsavel: false,
  perfis: [ROLE_CODES.PROFESSOR],
};

const responsavel: AlvoLinkTemporario = {
  ativo: true,
  vinculoAtivoNoColegio: true,
  ehResponsavel: true,
  perfis: [ROLE_CODES.RESPONSAVEL],
};

describe("expiracao do link temporario", () => {
  const agora = new Date("2026-11-05T12:00:00Z");

  it("vale por 24 horas", () => {
    expect(expiracaoLinkTemporario(agora).toISOString()).toBe(
      "2026-11-06T12:00:00.000Z",
    );
  });

  it("aceita link dentro do prazo e nao usado", () => {
    expect(
      tokenRecuperacaoVigente(
        {
          usedAt: null,
          expiresAt: expiracaoLinkTemporario(agora),
          usuario: { ativo: true },
        },
        agora,
      ),
    ).toBe(true);
  });

  it("recusa link expirado no limite exato", () => {
    expect(
      tokenRecuperacaoVigente(
        { usedAt: null, expiresAt: agora, usuario: { ativo: true } },
        agora,
      ),
    ).toBe(false);
  });

  it("recusa link ja usado ou cancelado por outro mais novo", () => {
    expect(
      tokenRecuperacaoVigente(
        {
          usedAt: agora,
          expiresAt: expiracaoLinkTemporario(agora),
          usuario: { ativo: true },
        },
        agora,
      ),
    ).toBe(false);
  });

  it("recusa link de usuario inativo", () => {
    expect(
      tokenRecuperacaoVigente(
        {
          usedAt: null,
          expiresAt: expiracaoLinkTemporario(agora),
          usuario: { ativo: false },
        },
        agora,
      ),
    ).toBe(false);
  });
});

describe("quem pode gerar link temporario", () => {
  it("permite gestor gerar para equipe e para responsavel", () => {
    expect(bloqueioLinkTemporario("EQUIPE", DIRETOR, equipe)).toBeNull();
    expect(
      bloqueioLinkTemporario("RESPONSAVEL", DIRETOR, responsavel),
    ).toBeNull();
  });

  it("bloqueia usuario inativo ou sem vinculo ativo no colegio", () => {
    expect(
      bloqueioLinkTemporario("EQUIPE", DIRETOR, { ...equipe, ativo: false }),
    ).toBe("USUARIO_INATIVO");
    expect(
      bloqueioLinkTemporario("EQUIPE", DIRETOR, {
        ...equipe,
        vinculoAtivoNoColegio: false,
      }),
    ).toBe("SEM_VINCULO");
  });

  it("so administrador gera link para administrador", () => {
    const alvoAdmin = { ...equipe, perfis: [ROLE_CODES.ADMINISTRADOR] };
    expect(bloqueioLinkTemporario("EQUIPE", DIRETOR, alvoAdmin)).toBe(
      "ADMINISTRADOR_PROTEGIDO",
    );
    expect(bloqueioLinkTemporario("EQUIPE", ADMIN, alvoAdmin)).toBeNull();
  });

  it("nao deixa a fila de responsaveis assumir conta de equipe", () => {
    expect(
      bloqueioLinkTemporario("RESPONSAVEL", [ROLE_CODES.CHEFE_CORPO_ALUNOS], {
        ...responsavel,
        perfis: [ROLE_CODES.RESPONSAVEL, ROLE_CODES.DIRETOR_PM],
      }),
    ).toBe("CONTA_DE_EQUIPE");
    expect(bloqueioLinkTemporario("RESPONSAVEL", DIRETOR, equipe)).toBe(
      "NAO_RESPONSAVEL",
    );
  });

  it("direciona responsavel puro para a tela de responsaveis", () => {
    expect(bloqueioLinkTemporario("EQUIPE", DIRETOR, responsavel)).toBe(
      "CONTA_DE_RESPONSAVEL",
    );
  });

  it("colega da equipe que tambem e responsavel e atendido como equipe", () => {
    expect(
      bloqueioLinkTemporario("EQUIPE", DIRETOR, {
        ...responsavel,
        perfis: [ROLE_CODES.RESPONSAVEL, ROLE_CODES.PROFESSOR],
      }),
    ).toBeNull();
  });
});
