import { describe, expect, it } from "vitest";

import { construirNotificacaoComunicacao } from "./notificacao-rules";

describe("construirNotificacaoComunicacao", () => {
  it("inclui o numero do processo no titulo quando disponivel", () => {
    const r = construirNotificacaoComunicacao({
      tipoOcorrencia: "DISCIPLINAR",
      numeroProcesso: "CPM-RG/2026/0042",
      alunoNome: "Maria da Silva",
    });
    expect(r.titulo).toBe(
      "Nova comunicação disciplinar — CPM-RG/2026/0042",
    );
    expect(r.mensagem).toContain("Maria da Silva");
    expect(r.mensagem).toContain("DISCIPLINAR");
  });

  it("usa titulo generico quando o numero do processo ainda nao existe", () => {
    const r = construirNotificacaoComunicacao({
      tipoOcorrencia: "FALTA_ESCOLAR",
      numeroProcesso: null,
      alunoNome: "João Pedro",
    });
    expect(r.titulo).toBe("Nova comunicação disciplinar");
    expect(r.mensagem).toContain("João Pedro");
  });
});
