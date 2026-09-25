import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "../permissions";
import { canAccessTenant, hasPermission } from "./rbac-core";

describe("rbac core", () => {
  it("allows only declared permissions", () => {
    const context = {
      permissoes: [PERMISSIONS.DASHBOARD_ACCESS],
    };

    expect(hasPermission(context, PERMISSIONS.DASHBOARD_ACCESS)).toBe(true);
    expect(hasPermission(context, PERMISSIONS.USUARIOS_MANAGE)).toBe(false);
  });

  it("blocks cross-tenant access", () => {
    const context = {
      colegioId: "colegio-a",
    };

    expect(canAccessTenant(context, "colegio-a")).toBe(true);
    expect(canAccessTenant(context, "colegio-b")).toBe(false);
  });
});
