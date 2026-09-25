import { describe, expect, it } from "vitest";

import { PERMISSIONS, ROLE_CODES } from "./permissions";
import { ROLE_PERMISSION_MATRIX } from "./role-permission-matrix";

describe("foundation permission catalog", () => {
  it("declares base registration permissions", () => {
    expect(Object.values(PERMISSIONS)).toEqual(
      expect.arrayContaining([
        "alunos.read",
        "alunos.transfer",
        "responsaveis.read",
        "turmas.read",
        "usuarios.manage",
        "tenancy.switch",
      ]),
    );
  });

  it("keeps stable initial role codes", () => {
    expect(Object.values(ROLE_CODES)).toEqual(
      expect.arrayContaining([
        "ADMINISTRADOR",
        "CHEFE_CORPO_ALUNOS",
        "PROFESSOR",
        "RESPONSAVEL",
      ]),
    );
  });

  it("does not give administrative student lists to guardians", () => {
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.RESPONSAVEL]).toContain(
      PERMISSIONS.DASHBOARD_ACCESS,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.RESPONSAVEL]).not.toContain(
      PERMISSIONS.ALUNOS_READ,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.RESPONSAVEL]).not.toContain(
      PERMISSIONS.USUARIOS_MANAGE,
    );
  });

  it("allows student transfer only to authorized institutional roles", () => {
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.DIRETOR_PM]).toContain(
      PERMISSIONS.ALUNOS_TRANSFER,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.DIRETOR_ADJUNTO]).toContain(
      PERMISSIONS.ALUNOS_TRANSFER,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.CHEFE_CORPO_ALUNOS]).toContain(
      PERMISSIONS.ALUNOS_TRANSFER,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.PROFESSOR]).not.toContain(
      PERMISSIONS.ALUNOS_TRANSFER,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.RESPONSAVEL]).not.toContain(
      PERMISSIONS.ALUNOS_TRANSFER,
    );
  });

  it("allows directors to manage operational records without managing schools", () => {
    for (const roleCode of [
      ROLE_CODES.DIRETOR_PM,
      ROLE_CODES.DIRETOR_ADJUNTO,
    ]) {
      expect(ROLE_PERMISSION_MATRIX[roleCode]).toEqual(
        expect.arrayContaining([
          PERMISSIONS.USUARIOS_MANAGE,
          PERMISSIONS.ALUNOS_READ,
          PERMISSIONS.ALUNOS_MANAGE,
          PERMISSIONS.RESPONSAVEIS_READ,
          PERMISSIONS.RESPONSAVEIS_MANAGE,
          PERMISSIONS.TURMAS_READ,
          PERMISSIONS.TURMAS_MANAGE,
        ]),
      );
      expect(ROLE_PERMISSION_MATRIX[roleCode]).not.toContain(
        PERMISSIONS.COLEGIOS_MANAGE,
      );
    }
  });

  it("allows tenant switching only to authorized institutional roles", () => {
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.DIRETOR_PM]).toContain(
      PERMISSIONS.TENANCY_SWITCH,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.DIRETOR_ADJUNTO]).toContain(
      PERMISSIONS.TENANCY_SWITCH,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.CHEFE_CORPO_ALUNOS]).toContain(
      PERMISSIONS.TENANCY_SWITCH,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.PROFESSOR]).not.toContain(
      PERMISSIONS.TENANCY_SWITCH,
    );
    expect(ROLE_PERMISSION_MATRIX[ROLE_CODES.RESPONSAVEL]).not.toContain(
      PERMISSIONS.TENANCY_SWITCH,
    );
  });
});
