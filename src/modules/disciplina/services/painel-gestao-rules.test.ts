import { describe, expect, it } from "vitest";

import {
  classificarSituacao,
  contarPorSituacao,
  diasDesde,
  montarPendencias,
  podeVerPainelGestao,
  resolverPeriodo,
  type EntradaPendencia,
} from "./painel-gestao-rules";

const AGORA = new Date("2026-11-06T15:00:00Z");

function entrada(
  id: string,
  tipo: EntradaPendencia["tipo"],
  desde: string,
  sancaoId?: string,
): EntradaPendencia {
  return {
    id,
    tipo,
    desde: new Date(desde),
    sancaoId,
    ocorrenciaId: "o",
    numero: "N",
    alunoNome: "Aluno",
  };
}

describe("podeVerPainelGestao", () => {
  it("libera somente Direcao, Chefe do Corpo de Alunos e Administrador", () => {
    expect(podeVerPainelGestao(["DIRETOR_PM"])).toBe(true);
    expect(podeVerPainelGestao(["DIRETOR_ADJUNTO"])).toBe(true);
    expect(podeVerPainelGestao(["CHEFE_CORPO_ALUNOS"])).toBe(true);
    expect(podeVerPainelGestao(["ADMINISTRADOR"])).toBe(true);
    expect(podeVerPainelGestao(["COMANDANTE_COMPANHIA"])).toBe(false);
    expect(podeVerPainelGestao(["COMANDANTE_PELOTAO"])).toBe(false);
    expect(podeVerPainelGestao(["PROFESSOR", "RESPONSAVEL"])).toBe(false);
    expect(podeVerPainelGestao([])).toBe(false);
  });
});

describe("classificarSituacao", () => {
  it("respeita os limites de 7 e 15 dias", () => {
    expect(classificarSituacao(0)).toBe("NORMAL");
    expect(classificarSituacao(7)).toBe("NORMAL");
    expect(classificarSituacao(8)).toBe("ATENCAO");
    expect(classificarSituacao(15)).toBe("ATENCAO");
    expect(classificarSituacao(16)).toBe("ATRASO");
  });

  it("conta dias completos e nunca fica negativo", () => {
    expect(diasDesde(new Date("2026-11-05T15:00:01Z"), AGORA)).toBe(0);
    expect(diasDesde(new Date("2026-11-05T15:00:00Z"), AGORA)).toBe(1);
    expect(diasDesde(new Date("2026-11-07T15:00:00Z"), AGORA)).toBe(0);
  });
});

describe("montarPendencias", () => {
  it("ordena da mais antiga para a mais nova e classifica", () => {
    const lista = montarPendencias(
      [
        entrada("a", "SEM_DECISAO", "2026-11-05T15:00:00Z"),
        entrada("b", "SEM_DECISAO", "2026-10-01T15:00:00Z"),
        entrada("c", "SANCAO_NAO_CUMPRIDA", "2026-10-26T15:00:00Z", "s1"),
      ],
      AGORA,
    );
    expect(lista.map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(contarPorSituacao(lista)).toEqual({
      NORMAL: 1,
      ATENCAO: 1,
      ATRASO: 1,
    });
  });

  it("nao conta duas vezes a sancao com reconsideracao pendente", () => {
    const lista = montarPendencias(
      [
        entrada("s", "SANCAO_NAO_CUMPRIDA", "2026-10-01T15:00:00Z", "s1"),
        entrada("r", "RECONSIDERACAO_PENDENTE", "2026-10-05T15:00:00Z", "s1"),
        entrada("t", "SANCAO_NAO_CUMPRIDA", "2026-10-02T15:00:00Z", "s2"),
      ],
      AGORA,
    );
    expect(lista.map((p) => p.id)).toEqual(["t", "r"]);
  });
});

describe("resolverPeriodo", () => {
  it("usa o ano letivo por padrao, no horario de Brasilia", () => {
    const p = resolverPeriodo({}, 2026, AGORA);
    expect(p.preset).toBe("ano");
    expect(p.inicio.toISOString()).toBe("2026-01-01T03:00:00.000Z");
    expect(p.fimExclusivo.toISOString()).toBe("2027-01-01T03:00:00.000Z");
  });

  it("calcula mes atual e ultimos 30 dias", () => {
    const mes = resolverPeriodo({ periodo: "mes" }, 2026, AGORA);
    expect([mes.de, mes.ate]).toEqual(["2026-11-01", "2026-11-06"]);
    const trinta = resolverPeriodo({ periodo: "30d" }, 2026, AGORA);
    expect([trinta.de, trinta.ate]).toEqual(["2026-10-08", "2026-11-06"]);
  });

  it("aceita periodo livre valido, inclusive o ultimo dia", () => {
    const p = resolverPeriodo(
      { periodo: "livre", de: "2026-03-01", ate: "2026-03-31" },
      2026,
      AGORA,
    );
    expect(p.preset).toBe("livre");
    expect(p.rotulo).toBe("01/03/2026 a 31/03/2026");
    expect(p.fimExclusivo.toISOString()).toBe("2026-04-01T03:00:00.000Z");
  });

  it("volta ao ano letivo com datas invalidas ou invertidas", () => {
    for (const params of [
      { periodo: "livre", de: "2026-03-31", ate: "2026-03-01" },
      { periodo: "livre", de: "2026-02-31", ate: "2026-03-01" },
      { periodo: "livre", de: "x' OR 1=1", ate: "2026-03-01" },
      { periodo: "livre" },
      { periodo: "qualquer" },
    ]) {
      expect(resolverPeriodo(params, 2026, AGORA).preset).toBe("ano");
    }
  });
});
