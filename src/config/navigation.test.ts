import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "@/modules/rbac/permissions";
import { ROLE_PERMISSION_MATRIX } from "@/modules/rbac/role-permission-matrix";

import { hrefAtivo, montarMenuCelular, NAV_ITEMS } from "./navigation";

function principaisDe(perfil: keyof typeof ROLE_PERMISSION_MATRIX) {
  return montarMenuCelular(ROLE_PERMISSION_MATRIX[perfil]).principais.map(
    (item) => item.label,
  );
}

describe("montarMenuCelular", () => {
  it("prioriza o dia a dia de cada perfil, com no maximo 4 destinos", () => {
    expect(principaisDe("DIRETOR_PM")).toEqual([
      "Início",
      "Ocorrências",
      "Nova",
      "Reconsiderar",
    ]);
    expect(principaisDe("PROFESSOR")).toEqual([
      "Início",
      "Ocorrências",
      "Nova",
      "Conduta",
    ]);
  });

  it("nao mostra destino sem permissao", () => {
    const menu = montarMenuCelular([PERMISSIONS.DASHBOARD_ACCESS]);
    expect(menu.principais.map((item) => item.href)).toEqual(["/dashboard"]);
    expect(menu.grupos.flatMap((g) => g.itens.map((i) => i.href))).toEqual([
      "/conta",
    ]);
  });

  it("nao perde nem repete nenhum item permitido entre a barra e o Mais", () => {
    const permissoes = ROLE_PERMISSION_MATRIX.ADMINISTRADOR;
    const menu = montarMenuCelular(permissoes);
    const naBarra = menu.principais.map((item) => item.href);
    const noMais = menu.grupos.flatMap((g) => g.itens.map((i) => i.href));
    const permitidos = NAV_ITEMS.filter((i) =>
      permissoes.includes(i.permission),
    ).map((i) => i.href);

    for (const href of permitidos) {
      expect([...naBarra, ...noMais]).toContain(href);
    }
    expect(new Set(noMais).size).toBe(noMais.length);
    expect(noMais.filter((href) => naBarra.includes(href))).toEqual([]);
  });
});

describe("hrefAtivo", () => {
  const hrefs = ["/disciplina/ocorrencias", "/disciplina/ocorrencias/nova", "/dashboard"];

  it("escolhe o caminho mais especifico", () => {
    expect(hrefAtivo("/disciplina/ocorrencias/nova", hrefs)).toBe(
      "/disciplina/ocorrencias/nova",
    );
    expect(hrefAtivo("/disciplina/ocorrencias/abc", hrefs)).toBe(
      "/disciplina/ocorrencias",
    );
  });

  it("nao confunde prefixo de palavra e aceita tela fora do menu", () => {
    expect(hrefAtivo("/dashboard-velho", hrefs)).toBeNull();
    expect(hrefAtivo("/conta", hrefs)).toBeNull();
  });
});
