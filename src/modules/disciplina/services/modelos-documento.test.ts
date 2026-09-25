import { describe, expect, it } from "vitest";

import {
  INSTITUICAO,
  modeloComunicacao,
  modeloDecisao,
  modeloElogio,
  modeloPortariaAfastamento,
  modeloTermoCiencia,
  TITULO_DOCUMENTO,
} from "./modelos-documento";

const UNIDADE = "Colégio da Polícia Militar - Rômulo Galvão";

describe("modelos-documento", () => {
  it("cabecalho: instituicao PMBA, subtitulos institucionais e CPM por ultimo", () => {
    const spec = modeloComunicacao({
      unidade: UNIDADE,
      tipo: "DISCIPLINAR",
      dataOcorrencia: "2026-03-10",
      comunicante: "Prof. Fulano",
      aluno: "Aluno Um",
      matricula: "123",
      descricao: "Uso de celular em aula.",
    });
    expect(spec.cabecalhoInstituicao).toBe(INSTITUICAO);
    expect(INSTITUICAO.toLowerCase()).toContain("polícia militar da bahia");
    expect(spec.cabecalhoSubtitulos?.join(" ")).toContain(
      "Corpo Discente / Pelotão de Alunos",
    );
    expect(spec.cabecalhoUnidade).toBe(UNIDADE);
    expect(spec.titulo).toBe(TITULO_DOCUMENTO.COMUNICACAO);
  });

  it("comunicacao e sempre de UM aluno e UM numero, mesmo quando o fato foi coletivo", () => {
    // Cada aluno de uma comunicacao coletiva vira seu proprio OcorrenciaAluno
    // com numero proprio (numeracao-service.ts); a impressao reflete isso -
    // nao ha campo/paragrafo que junte varios alunos num so documento.
    const spec = modeloComunicacao({
      unidade: UNIDADE,
      tipo: "DISCIPLINAR",
      dataOcorrencia: "2026-03-10",
      local: "Sala 12",
      materia: "Língua Portuguesa",
      comunicante: "Roseane Silva Rodrigues",
      comunicantePosto: "ST PM",
      aluno: "Aluno Um",
      matricula: "123",
      serie: "9º ano",
      turma: "B",
      numeroProcesso: "CPM-BA-RG/2026/0007",
      descricao: "Uso de celular em aula.",
    });
    expect(spec.numero).toBe("CPM-BA-RG/2026/0007");
    expect(spec.campos.find((c) => c.rotulo === "Aluno")?.valor).toBe(
      "Aluno Um (mat. 123)",
    );
    expect(spec.campos.find((c) => c.rotulo === "Disciplinar")?.valor).toBe(
      "Língua Portuguesa",
    );
    expect(spec.campos.find((c) => c.rotulo === "Do(a)")?.valor).toBe(
      "ST PM Roseane Silva Rodrigues",
    );
    expect(spec.paragrafos.join(" ")).toContain("Uso de celular em aula.");
    // nao pode haver qualquer rastro de "varios alunos"/lista de numeros
    expect(JSON.stringify(spec)).not.toContain("Numeros:");
  });

  it("decisao mostra sancao, atenuantes/agravantes e fundamentacao", () => {
    const spec = modeloDecisao({
      unidade: UNIDADE,
      numero: "CPM-BA-RG-DEC/2026/0002",
      aluno: "Aluno Um",
      resultado: "PROCEDENTE",
      naturezaApurada: "MEDIA",
      enquadramentos: [
        { transgressao: "M01", natureza: "MEDIA", descricao: "Desrespeito" },
      ],
      atenuantes: ["Primeira falta"],
      agravantes: [],
      sancao: "REPREENSAO",
      dias: null,
      fundamentacao: "Conduta incompatível com o regime escolar.",
      autoridade: "Cap. Beltrano",
      perfilAutoridade: "CHEFE_CORPO_ALUNOS",
    });
    expect(spec.campos.find((c) => c.rotulo === "Sanção")?.valor).toContain(
      "REPREENSAO",
    );
    expect(spec.campos.find((c) => c.rotulo === "Atenuantes")?.valor).toContain(
      "Primeira falta",
    );
    expect(spec.paragrafos.join(" ")).toContain("15 (quinze) dias");
  });

  it("portaria de afastamento deixa claro que nao e sancao", () => {
    const spec = modeloPortariaAfastamento({
      unidade: UNIDADE,
      aluno: "Aluno Um",
      justificativa: "Risco a ordem.",
      inicioEm: "2026-03-10",
      fimPrevisto: "2026-03-15",
      dias: 5,
      determinadoPor: "Cel. Diretor",
    });
    expect(spec.paragrafos.join(" ")).toContain("NÃO constitui sanção");
  });

  it("termo de ciencia distingue ocorrencia de decisao", () => {
    const dec = modeloTermoCiencia({
      unidade: UNIDADE,
      aluno: "Aluno Um",
      sobre: "DECISAO",
      meio: "PORTAL",
      dataCiencia: "2026-03-11T10:00:00Z",
      confirmadaPor: "Sgt. Cicrano",
    });
    expect(dec.paragrafos.join(" ")).toContain("da decisão disciplinar");
  });

  it("elogio: um numero, um aluno, mesmo padrao da comunicacao", () => {
    const spec = modeloElogio({
      unidade: UNIDADE,
      numero: "CPM-BA-RG-ELG/2026/0001",
      aluno: "Aluno Um",
      matricula: "123",
      tipoElogio: "Destaque acadêmico",
      valorPontos: 0.5,
      descricao: "Iniciativa em ajudar colegas na atividade de grupo.",
      concedidoEm: "2026-03-10",
      registradoPor: "Fábio Nilo Soares",
      registradoPorPosto: "Cap PM",
    });
    expect(spec.numero).toBe("CPM-BA-RG-ELG/2026/0001");
    expect(spec.titulo).toBe(TITULO_DOCUMENTO.ELOGIO);
    expect(spec.campos.find((c) => c.rotulo === "Pontos")?.valor).toBe(
      "+0.50",
    );
    expect(
      spec.assinaturas.find((a) => a.cargo === "Registrado por")?.nome,
    ).toBe("Cap PM Fábio Nilo Soares");
    expect(spec.paragrafos.join(" ")).toContain(
      "Iniciativa em ajudar colegas",
    );
  });
});
