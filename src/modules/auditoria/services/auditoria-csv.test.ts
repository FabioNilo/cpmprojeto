import { describe, expect, it } from "vitest";

import { toAuditoriaCsv } from "./auditoria-csv";

describe("toAuditoriaCsv", () => {
  it("gera cabecalho e uma linha por registro", () => {
    const csv = toAuditoriaCsv([
      {
        dataHora: new Date("2026-08-30T12:00:00.000Z"),
        acao: "LOGIN_SUCESSO",
        entidade: "sessoes",
        entidadeId: "abc",
        ip: "10.0.0.1",
        usuario: { nome: "Fulano" },
      },
    ]);

    const [header, linha] = csv.split("\r\n");
    expect(header).toBe("data_hora;acao;entidade;entidade_id;usuario;ip");
    expect(linha).toBe(
      "2026-08-30T12:00:00.000Z;LOGIN_SUCESSO;sessoes;abc;Fulano;10.0.0.1",
    );
  });

  it("usa campo vazio para valores ausentes", () => {
    const csv = toAuditoriaCsv([
      {
        dataHora: new Date("2026-01-01T00:00:00.000Z"),
        acao: "LOGOUT",
        entidade: null,
        entidadeId: null,
        ip: null,
        usuario: null,
      },
    ]);

    expect(csv.split("\r\n")[1]).toBe("2026-01-01T00:00:00.000Z;LOGOUT;;;;");
  });

  it("escapa separador, aspas e quebras de linha", () => {
    const csv = toAuditoriaCsv([
      {
        dataHora: new Date("2026-08-30T12:00:00.000Z"),
        acao: "ALTERACAO_USUARIO",
        entidade: null,
        entidadeId: null,
        ip: null,
        usuario: { nome: 'Silva; "Junior"\nMPB' },
      },
    ]);

    const linha = csv.split("\r\n")[1];
    expect(linha).toContain('"Silva; ""Junior""');
  });
});
