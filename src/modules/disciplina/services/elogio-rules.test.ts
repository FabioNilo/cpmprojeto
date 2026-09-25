import { describe, expect, it } from "vitest";

import { formatarNumeroElogio } from "./elogio-rules";

describe("formatarNumeroElogio", () => {
  it("monta codigo-ELG/ano/sequencial com 4 digitos", () => {
    expect(formatarNumeroElogio("CPM-BA-RG", 2026, 7)).toBe(
      "CPM-BA-RG-ELG/2026/0007",
    );
  });

  it("nao trunca sequencial com mais de 4 digitos", () => {
    expect(formatarNumeroElogio("CPM-BA-RG", 2026, 12345)).toBe(
      "CPM-BA-RG-ELG/2026/12345",
    );
  });
});
