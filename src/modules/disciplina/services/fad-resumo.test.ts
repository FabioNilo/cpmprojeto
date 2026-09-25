import { describe, expect, it } from "vitest";

import {
  agruparPorPublicacao,
  construirResumoFad,
  distribuicaoPorTipoSancao,
  extrairContextoLegado,
  naturezaMaisRecorrente,
  separarNaturezaRelato,
  type LinhaProcesso,
  type ProcessoFicha,
} from "./fad-resumo";

describe("separarNaturezaRelato", () => {
  it("separa na fronteira minuscula+maiuscula sem espaco (artefato do import)", () => {
    const r = separarNaturezaRelato(
      "Deixar de trazer material pedagogicoO aluno nao trouxe o caderno",
    );
    expect(r.natureza).toBe("Deixar de trazer material pedagogico.");
    expect(r.relato).toBe("O aluno nao trouxe o caderno");
  });

  it("respeita ponto ja existente na fronteira", () => {
    const r = separarNaturezaRelato(
      "Utilizar aparelho sonoro.Segundo o discente estava com a mae",
    );
    expect(r.natureza).toBe("Utilizar aparelho sonoro.");
    expect(r.relato).toBe("Segundo o discente estava com a mae");
  });

  it("nao separa em espaco normal antes de nome proprio (falso positivo real, ja visto em producao)", () => {
    // "do Colegio" e "mercado Gbarbosa" sao so texto corrido - nao ha
    // artefato de concatenacao aqui (tem espaco), entao NAO deve cortar.
    const r = separarNaturezaRelato(
      "Ter atitudes incompativeis com os padroes do Colegio",
    );
    expect(r.relato).toBe("");
    expect(r.natureza).toContain("do Colegio");
  });

  it("sem continuacao (so a frase da natureza): tudo vira natureza, relato vazio", () => {
    // Regressao: antes esse caso caia em "relato" sem ponto final, contando
    // como categoria diferente do mesmo texto quando ELE TINHA continuacao
    // em outro processo - subestimava a natureza mais recorrente (11 em vez
    // de 21 no caso real do Joaquim/24109).
    const r = separarNaturezaRelato(
      "Deixar de realizar tarefa atribuida pelo professor ou coordenador",
    );
    expect(r.natureza).toBe(
      "Deixar de realizar tarefa atribuida pelo professor ou coordenador.",
    );
    expect(r.relato).toBe("");
  });
});

describe("extrairContextoLegado", () => {
  it("extrai relator, data e texto do formato fixo do import bancoFad", () => {
    const descricao =
      "Comunicação nº26C0016 feita por Saionara Muniz Rodrigues em data de: 06-03-2026 , que relatou:Portar-se de forma inconvenienteAluno inquieto.\n--\nImportado do bancoFad (SEF). Disposicao registrada: IMPEDIMENTO BIC 3 Notificacao 151689 Responsavel deu ciencia (ASS P/ RESP = SIM).";
    const r = extrairContextoLegado(descricao);
    expect(r).not.toBeNull();
    expect(r?.relator).toBe("Saionara Muniz Rodrigues");
    expect(r?.dataFato?.getFullYear()).toBe(2026);
    expect(r?.dataFato?.getMonth()).toBe(2); // marco = indice 2
    expect(r?.dataFato?.getDate()).toBe(6);
    expect(r?.texto).toBe("Portar-se de forma inconvenienteAluno inquieto.");
  });

  it("retorna null quando o texto nao segue o padrao de importacao", () => {
    expect(extrairContextoLegado("Uso de celular em aula.")).toBeNull();
  });
});

describe("distribuicaoPorTipoSancao", () => {
  it("ordena do mais grave pro mais leve e ignora tipos sem ocorrencia", () => {
    const linhas: LinhaProcesso[] = [
      linha({ tipoSancao: "ADVERTENCIA" }),
      linha({ tipoSancao: "REPREENSAO" }),
      linha({ tipoSancao: "REPREENSAO" }),
      linha({ tipoSancao: "SUSPENSAO_COM_PREJUIZO" }),
      linha({ tipoSancao: null }),
    ];
    const dist = distribuicaoPorTipoSancao(linhas);
    expect(dist.map((d) => d.codigo)).toEqual([
      "SUSPENSAO_COM_PREJUIZO",
      "REPREENSAO",
      "ADVERTENCIA",
    ]);
    expect(dist.find((d) => d.codigo === "REPREENSAO")?.qtd).toBe(2);
  });
});

describe("naturezaMaisRecorrente", () => {
  it("usa natureza quando disponivel, relato como fallback, sem contar linhas vazias", () => {
    const linhas: LinhaProcesso[] = [
      linha({ natureza: "Chegar atrasado.", relato: "x" }),
      linha({ natureza: "Chegar atrasado.", relato: "y" }),
      linha({ natureza: null, relato: "Uso de celular." }),
    ];
    const r = naturezaMaisRecorrente(linhas);
    expect(r).toEqual({ texto: "Chegar atrasado.", qtd: 2 });
  });
});

describe("agruparPorPublicacao", () => {
  it("ordena pelo numero do boletim, nao pela data (BIC 14 antes do BIC 16 mesmo com data posterior)", () => {
    const linhas: LinhaProcesso[] = [
      linha({ numeroPublicacao: "BIC 016", data: new Date("2026-05-21") }),
      linha({ numeroPublicacao: "BIC 014", data: new Date("2026-06-16") }),
      linha({ numeroPublicacao: "BIC 3", data: new Date("2025-10-21") }),
    ];
    const grupos = agruparPorPublicacao(linhas);
    expect(grupos.map((g) => g.chave)).toEqual(["BIC 3", "BIC 014", "BIC 016"]);
  });

  it("processos sem publicacao vao pro final", () => {
    const linhas: LinhaProcesso[] = [
      linha({ numeroPublicacao: null }),
      linha({ numeroPublicacao: "BIC 1" }),
    ];
    const grupos = agruparPorPublicacao(linhas);
    expect(grupos[grupos.length - 1].chave).toBe("Sem publicação registrada");
  });
});

describe("construirResumoFad (fim a fim)", () => {
  it("reproduz o caso real do Joaquim/24109 nos pontos criticos", () => {
    const legado = (
      relato: string,
      tipo: string,
      bic: string,
      data: string,
    ): ProcessoFicha => ({
      numeroProcesso: "X",
      status: "PROCEDENTE",
      ocorrencia: {
        numero: "X",
        data: new Date(data).toISOString(),
        descricao: `Comunicação nº1 feita por Fulana de Tal em data de: ${dataImport(data)} , que relatou:${relato}\n--\nImportado do bancoFad (SEF). Disposicao registrada: X BIC ${bic} Notificacao 1 Responsavel deu ciencia (ASS P/ RESP = SIM).`,
      },
      sancoes: [
        {
          tipo,
          dias: null,
          impacto: -0.1,
          status: "CUMPRIDA",
          numero: `BIC ${bic}`,
          aplicadaEm: new Date(data).toISOString(),
        },
      ],
    });

    const conteudo = {
      totais: { processos: 3, procedentes: 3 },
      processos: [
        legado(
          "Deixar de realizar tarefa atribuida pelo professor ou coordenadorO aluno nao fez a licao",
          "REPREENSAO",
          "3",
          "2025-10-21",
        ),
        // mesma natureza, mas SEM continuacao no relato (caso que causava a subcontagem)
        legado(
          "Deixar de realizar tarefa atribuida pelo professor ou coordenador",
          "ADVERTENCIA",
          "4",
          "2026-03-27",
        ),
        legado("Chegar atrasado", "ADVERTENCIA", "4", "2026-04-01"),
      ],
    };

    const resumo = construirResumoFad(conteudo);
    expect(resumo.naturezaRecorrente?.texto).toBe(
      "Deixar de realizar tarefa atribuida pelo professor ou coordenador.",
    );
    expect(resumo.naturezaRecorrente?.qtd).toBe(2);
    expect(resumo.grupos.map((g) => g.chave)).toEqual(["BIC 3", "BIC 4"]);
  });

  it("propaga contadores de elogios do snapshot", () => {
    const resumo = construirResumoFad({
      totais: { processos: 0, procedentes: 0, elogios: 4, elogiosPontos: 1.3 },
      processos: [],
    });
    expect(resumo.contadores.elogios).toBe(4);
    expect(resumo.contadores.elogiosPontos).toBe(1.3);
  });

  it("usa 0 como fallback quando o snapshot nao tem elogios (versao antiga)", () => {
    const resumo = construirResumoFad({
      totais: { processos: 0, procedentes: 0 },
      processos: [],
    });
    expect(resumo.contadores.elogios).toBe(0);
    expect(resumo.contadores.elogiosPontos).toBe(0);
  });
});

function linha(overrides: Partial<LinhaProcesso>): LinhaProcesso {
  return {
    numeroProcesso: "P",
    data: new Date("2026-01-01"),
    natureza: null,
    relato: "relato",
    relator: "Relator",
    tipoSancao: null,
    numeroPublicacao: null,
    ...overrides,
  };
}

function dataImport(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}
