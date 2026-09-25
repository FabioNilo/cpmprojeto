import { describe, expect, it } from "vitest";

import {
  competenciaPermiteSancao,
  formatarNumeroDecisao,
  naturezaMaisGrave,
  perfilComCompetencia,
  podeDecidir,
  podeEnquadrar,
  statusOcorrenciaAposDecisao,
  statusProcessoAposDecisao,
  type CompetenciaSancao,
} from "./decisao-rules";

describe("decisao-rules", () => {
  it("so permite enquadrar/decidir com ocorrencia em analise e processo pendente", () => {
    expect(podeEnquadrar("EM_ANALISE", "PENDENTE")).toBe(true);
    expect(podeEnquadrar("AGUARDANDO_CIENCIA", "PENDENTE")).toBe(true);
    expect(podeEnquadrar("EM_ANALISE", "PROCEDENTE")).toBe(false);
    expect(podeEnquadrar("ENCERRADA", "PENDENTE")).toBe(false);
    expect(podeDecidir("RASCUNHO", "PENDENTE")).toBe(false);
  });

  it("mapeia resultado -> status do processo", () => {
    expect(statusProcessoAposDecisao("PROCEDENTE")).toBe("PROCEDENTE");
    expect(statusProcessoAposDecisao("IMPROCEDENTE")).toBe("IMPROCEDENTE");
    expect(statusProcessoAposDecisao("ARQUIVADO")).toBe("ARQUIVADO");
    expect(statusProcessoAposDecisao("ENCAMINHADO_SINDICANCIA")).toBe("PENDENTE");
  });

  it("ocorrencia so vai para DECIDIDA quando nenhum processo esta pendente", () => {
    expect(
      statusOcorrenciaAposDecisao(["PROCEDENTE", "PENDENTE"], "EM_ANALISE"),
    ).toBe("EM_ANALISE");
    expect(
      statusOcorrenciaAposDecisao(["PROCEDENTE", "JUSTIFICADO"], "EM_ANALISE"),
    ).toBe("DECIDIDA");
    expect(
      statusOcorrenciaAposDecisao(["PENDENTE"], "ARQUIVADA"),
    ).toBe("ARQUIVADA");
  });

  it("escolhe a natureza mais grave entre enquadramentos", () => {
    expect(naturezaMaisGrave(["LEVE", "GRAVE", "MEDIA"])).toBe("GRAVE");
    expect(naturezaMaisGrave(["LEVE"])).toBe("LEVE");
    expect(naturezaMaisGrave([])).toBeNull();
  });

  it("valida competencia por ordem de sancao e dias maximos (anexoA secao 7)", () => {
    const cmtPelotao: CompetenciaSancao = {
      perfilCodigo: "COMANDANTE_PELOTAO",
      sancaoMaxOrdem: 4, // SUSPENSAO_SEM_PREJUIZO
      diasMax: null,
    };
    const cmtCia: CompetenciaSancao = {
      perfilCodigo: "COMANDANTE_COMPANHIA",
      sancaoMaxOrdem: 4,
      diasMax: 3,
    };

    // impedimento (ordem 1) sempre cabe
    expect(competenciaPermiteSancao([cmtPelotao], 1, null)).toBe(true);
    // suspensao com prejuizo (ordem 5) acima da alcada do pelotao
    expect(competenciaPermiteSancao([cmtPelotao], 5, null)).toBe(false);
    // cia limitada a 3 dias
    expect(competenciaPermiteSancao([cmtCia], 4, 5)).toBe(false);
    expect(competenciaPermiteSancao([cmtCia], 4, 2)).toBe(true);
    // qualquer competencia da lista basta
    expect(competenciaPermiteSancao([cmtCia, cmtPelotao], 4, 5)).toBe(true);
    expect(perfilComCompetencia([cmtCia, cmtPelotao], 4, 5)).toBe(
      "COMANDANTE_PELOTAO",
    );
    expect(perfilComCompetencia([cmtCia], 5, null)).toBeNull();
  });

  it("formata numero oficial da decisao", () => {
    expect(formatarNumeroDecisao("CPM-BA-RG", 2026, 7)).toBe(
      "CPM-BA-RG-DEC/2026/0007",
    );
  });
});
