import { describe, expect, it } from "vitest";

import { ROLE_CODES } from "../permissions";
import {
  podeAlterarIdentidadeDoPerfil,
  podeEditarPermissoesDoPerfil,
  podeGerenciarPerfil,
} from "./rbac-admin-rules";

const perfilSistema = { codigo: "DIRETOR_PM", sistema: true };
const perfilAdmin = { codigo: ROLE_CODES.ADMINISTRADOR, sistema: true };
const perfilCustom = { codigo: "COORDENADOR", sistema: false };

describe("rbac-admin-rules", () => {
  it("so administrador gerencia o perfil ADMINISTRADOR", () => {
    expect(podeGerenciarPerfil(perfilAdmin, [ROLE_CODES.ADMINISTRADOR])).toBe(
      true,
    );
    expect(podeGerenciarPerfil(perfilAdmin, [ROLE_CODES.DIRETOR_PM])).toBe(
      false,
    );
  });

  it("qualquer gestor de RBAC gerencia perfis nao-administradores", () => {
    expect(podeGerenciarPerfil(perfilSistema, [ROLE_CODES.DIRETOR_PM])).toBe(
      true,
    );
    expect(podeGerenciarPerfil(perfilCustom, [ROLE_CODES.DIRETOR_PM])).toBe(
      true,
    );
  });

  it("identidade de perfil de sistema e imutavel; custom e editavel", () => {
    expect(podeAlterarIdentidadeDoPerfil(perfilSistema)).toBe(false);
    expect(podeAlterarIdentidadeDoPerfil(perfilAdmin)).toBe(false);
    expect(podeAlterarIdentidadeDoPerfil(perfilCustom)).toBe(true);
  });

  it("permissoes de perfil de sistema sao editaveis, exceto do ADMINISTRADOR", () => {
    expect(
      podeEditarPermissoesDoPerfil(perfilSistema, [ROLE_CODES.ADMINISTRADOR]),
    ).toBe(true);
    expect(
      podeEditarPermissoesDoPerfil(perfilAdmin, [ROLE_CODES.ADMINISTRADOR]),
    ).toBe(false);
  });
});
