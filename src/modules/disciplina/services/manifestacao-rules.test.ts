import { describe, expect, it } from "vitest";

import {
  podeAvaliarManifestacao,
  podeConfirmarCiencia,
  podeManifestar,
  statusAposAvaliacao,
  statusOcorrenciaAposCiencia,
  statusOcorrenciaAposManifestacao,
} from "./manifestacao-rules";

describe("manifestacao-rules", () => {
  it("permite manifestar so com ocorrencia aberta e processo pendente", () => {
    expect(podeManifestar("EM_AVERIGUACAO", "PENDENTE")).toBe(true);
    expect(podeManifestar("AGUARDANDO_CIENCIA", "PENDENTE")).toBe(true);
    expect(podeManifestar("EM_ANALISE", "PENDENTE")).toBe(false);
    expect(podeManifestar("EM_AVERIGUACAO", "JUSTIFICADO")).toBe(false);
    expect(podeManifestar("ENCERRADA", "PENDENTE")).toBe(false);
  });

  it("ciencia exige acao formal e nao repete", () => {
    expect(podeConfirmarCiencia("AGUARDANDO_CIENCIA", false)).toBe(true);
    expect(podeConfirmarCiencia("EM_ANALISE", false)).toBe(true);
    expect(podeConfirmarCiencia("AGUARDANDO_CIENCIA", true)).toBe(false);
    expect(podeConfirmarCiencia("ENCERRADA", false)).toBe(false);
  });

  it("avalia manifestacao so com processo pendente e ao menos uma manifestacao", () => {
    expect(podeAvaliarManifestacao("PENDENTE", 1)).toBe(true);
    expect(podeAvaliarManifestacao("PENDENTE", 0)).toBe(false);
    expect(podeAvaliarManifestacao("JUSTIFICADO", 2)).toBe(false);
  });

  it("acolhida => JUSTIFICADO; nao acolhida => segue PENDENTE", () => {
    expect(statusAposAvaliacao(true)).toBe("JUSTIFICADO");
    expect(statusAposAvaliacao(false)).toBe("PENDENTE");
  });

  it("avanca o estado da ocorrencia no fluxo", () => {
    expect(statusOcorrenciaAposManifestacao("ENVIADA")).toBe(
      "AGUARDANDO_MANIFESTACAO",
    );
    expect(statusOcorrenciaAposManifestacao("AGUARDANDO_CIENCIA")).toBe(
      "AGUARDANDO_CIENCIA",
    );
    expect(statusOcorrenciaAposCiencia("AGUARDANDO_CIENCIA")).toBe("EM_ANALISE");
    expect(statusOcorrenciaAposCiencia("ENCERRADA")).toBe("ENCERRADA");
  });
});
