import { execSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { prisma } from "@/db/prisma";
import { PERMISSIONS, ROLE_CODES } from "@/modules/rbac/permissions";

const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  "postgresql://cpm:cpm_dev_password@localhost:5435/cpm_disciplinar_test?schema=public";

describe("prisma/seed.ts (fundacao RBAC)", () => {
  it(
    "cria as permissoes, perfis e colegios iniciais",
    { timeout: 90000 },
    async () => {
      execSync("npx tsx prisma/seed.ts", {
        stdio: "pipe",
        env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      });

      const [permissoes, perfis, colegios, adminPerfil] = await Promise.all([
        prisma.permissao.findMany({ select: { codigo: true } }),
        prisma.perfil.findMany({ select: { codigo: true } }),
        prisma.colegio.count(),
        prisma.perfil.findFirst({
          where: { codigo: ROLE_CODES.ADMINISTRADOR },
          include: { permissoes: true },
        }),
      ]);

      expect(permissoes.map((p) => p.codigo).sort()).toEqual(
        Object.values(PERMISSIONS).sort(),
      );
      expect(perfis.map((p) => p.codigo).sort()).toEqual(
        Object.values(ROLE_CODES).sort(),
      );
      expect(colegios).toBeGreaterThanOrEqual(2);
      expect(adminPerfil?.permissoes.length).toBe(
        Object.values(PERMISSIONS).length,
      );
    },
  );
});
