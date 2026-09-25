import type { DocumentoSpec } from "@/lib/pdf/pm-documento";

export const TIPOS_DOCUMENTO = [
  "COMUNICACAO",
  "TERMO_CIENCIA",
  "DECISAO",
  "DESPACHO_RECONSIDERACAO",
  "PORTARIA_AFASTAMENTO",
  "PARECER_CONSELHO",
  "FAD",
  "ELOGIO",
] as const;
export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const TITULO_DOCUMENTO: Record<TipoDocumento, string> = {
  COMUNICACAO: "Comunicação Disciplinar",
  TERMO_CIENCIA: "Termo de Ciência",
  DECISAO: "Decisão Disciplinar",
  DESPACHO_RECONSIDERACAO: "Despacho de Reconsideração",
  PORTARIA_AFASTAMENTO: "Portaria de Afastamento Cautelar",
  PARECER_CONSELHO: "Parecer do Conselho Disciplinar",
  FAD: "Ficha de Acompanhamento Disciplinar",
  ELOGIO: "Elogio",
};

// Cabecalho padrao pedido: instituicao em cima, unidade (CPM) logo abaixo.
export const INSTITUICAO = "Polícia Militar da Bahia";

// Linhas institucionais fixas do formulario em papel, entre a instituicao e
// o nome do colegio (iguais em qualquer documento oficial do CPM).
const SUBTITULOS_INSTITUCIONAIS = [
  "Instituto de Ensino e Pesquisa",
  "Coordenadoria dos Colégios da Polícia Militar",
];

const RODAPE_MINUTA =
  "Minuta gerada pelo Sistema Disciplinar CPM - texto sujeito a ajuste conforme o Regimento Escolar dos Colégios da PMBA.";

function dataBR(valor: string | Date | null | undefined): string {
  if (!valor) return "-";
  const d = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

// Junta posto/graduacao (opcional) ao nome, como aparece no formulario em
// papel ("1o TEN PM FULANO DE TAL"). Sem posto cadastrado, mostra so o nome.
function nomeComPosto(nome: string, posto?: string | null): string {
  return posto ? `${posto} ${nome}` : nome;
}

function base(
  unidade: string,
  titulo: string,
  subtitulosExtra: string[] = [],
): Pick<
  DocumentoSpec,
  "cabecalhoInstituicao" | "cabecalhoSubtitulos" | "cabecalhoUnidade" | "titulo" | "rodape"
> {
  return {
    cabecalhoInstituicao: INSTITUICAO,
    cabecalhoSubtitulos: [...SUBTITULOS_INSTITUCIONAIS, ...subtitulosExtra],
    cabecalhoUnidade: unidade,
    titulo,
    rodape: RODAPE_MINUTA,
  };
}

// --- COMUNICACAO ---------------------------------------------------------------

// Uma Comunicacao impressa = um numero = um aluno, sempre. Quando o mesmo
// fato envolve varios alunos, cada um gera seu proprio registro de
// OcorrenciaAluno com numero proprio (numeracao-service.ts) e, portanto, seu
// proprio documento - mesmo que o registro no sistema tenha sido feito de
// uma so vez. Isso vale tanto para comunicacao disciplinar quanto, pelo
// mesmo raciocinio, para elogio (ver modeloElogio abaixo).
export type DadosComunicacao = {
  unidade: string;
  numeroProcesso?: string | null;
  tipo: string;
  materia?: string | null;
  dataOcorrencia: string | Date;
  local?: string | null;
  comunicante: string;
  comunicantePosto?: string | null;
  aluno: string;
  matricula?: string | null;
  serie?: string | null;
  turma?: string | null;
  descricao: string;
};

export function modeloComunicacao(d: DadosComunicacao): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.COMUNICACAO, [
      "Corpo Discente / Pelotão de Alunos",
    ]),
    numero: d.numeroProcesso ?? undefined,
    campos: [
      {
        rotulo: "Do(a)",
        valor: nomeComPosto(d.comunicante, d.comunicantePosto),
      },
      { rotulo: "Disciplinar", valor: d.materia ?? "-" },
      { rotulo: "Ao", valor: "Chefe do Corpo de Alunos" },
      { rotulo: "Data do fato", valor: dataBR(d.dataOcorrencia) },
      { rotulo: "Local", valor: d.local ?? "-" },
      {
        rotulo: "Aluno",
        valor: `${d.aluno}${d.matricula ? ` (mat. ${d.matricula})` : ""}`,
      },
      {
        rotulo: "Série/Turma",
        valor: `${d.serie ?? "-"}${d.turma ? ` / Turma ${d.turma}` : ""}`,
      },
    ],
    paragrafos: [
      `Comunico a V. Sa. que o(a) aluno(a) acima identificado(a) praticou, na data indicada, o fato disciplinar a seguir descrito, que deverá ser averiguado pela autoridade competente. A presente comunicação registra um fato e não implica, por si só, o reconhecimento de transgressão ou a aplicação de sanção.`,
      `RELATO: ${d.descricao}`,
      "Fica assegurado ao aluno e ao seu responsável o direito ao contraditório e à ampla defesa, com prazo para manifestação e ciência na forma do Regimento Escolar dos Colégios da Polícia Militar da Bahia.",
    ],
    assinaturas: [
      {
        nome: nomeComPosto(d.comunicante, d.comunicantePosto),
        cargo: "Comunicante",
      },
    ],
  };
}

// --- TERMO DE CIENCIA --------------------------------------------------------

export type DadosTermoCiencia = {
  unidade: string;
  numeroProcesso?: string | null;
  aluno: string;
  matricula?: string | null;
  sobre: string; // OCORRENCIA | DECISAO
  meio: string;
  dataCiencia: string | Date;
  confirmadaPor: string;
  observacao?: string | null;
};

export function modeloTermoCiencia(d: DadosTermoCiencia): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.TERMO_CIENCIA),
    numero: d.numeroProcesso ?? undefined,
    campos: [
      { rotulo: "Aluno", valor: d.aluno },
      { rotulo: "Matrícula", valor: d.matricula ?? "-" },
      { rotulo: "Objeto da ciência", valor: d.sobre },
      { rotulo: "Meio", valor: d.meio },
      { rotulo: "Data e hora", valor: new Date(d.dataCiencia).toLocaleString("pt-BR") },
      { rotulo: "Registrada por", valor: d.confirmadaPor },
    ],
    paragrafos: [
      `Declaro, para os devidos fins, ter tomado ciência formal do teor ${
        d.sobre === "DECISAO" ? "da decisão disciplinar" : "da comunicação disciplinar"
      } acima identificada, ficando cientificado(a) dos prazos e providências aplicáveis, inclusive do direito de manifestação e, quando cabível, de reconsideração no prazo regulamentar.`,
      d.observacao ? `Observação: ${d.observacao}` : "",
    ].filter(Boolean),
    assinaturas: [
      { nome: "Responsável / Aluno", cargo: "Ciente" },
      { nome: d.confirmadaPor, cargo: "Servidor que registrou a ciência" },
    ],
  };
}

// --- DECISAO ---------------------------------------------------------------

export type DadosDecisao = {
  unidade: string;
  numero?: string | null;
  numeroProcesso?: string | null;
  aluno: string;
  matricula?: string | null;
  resultado: string;
  naturezaApurada?: string | null;
  enquadramentos: Array<{ transgressao: string; natureza: string; descricao: string }>;
  atenuantes: string[];
  agravantes: string[];
  sancao?: string | null;
  dias?: number | null;
  fundamentacao: string;
  autoridade: string;
  autoridadePosto?: string | null;
  perfilAutoridade: string;
};

export function modeloDecisao(d: DadosDecisao): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.DECISAO),
    numero: d.numero ?? undefined,
    campos: [
      { rotulo: "Processo", valor: d.numeroProcesso ?? "-" },
      { rotulo: "Aluno", valor: `${d.aluno}${d.matricula ? ` (mat. ${d.matricula})` : ""}` },
      { rotulo: "Resultado", valor: d.resultado },
      { rotulo: "Natureza apurada", valor: d.naturezaApurada ?? "-" },
      {
        rotulo: "Enquadramento(s)",
        valor:
          d.enquadramentos.length > 0
            ? d.enquadramentos
                .map((e) => `${e.transgressao} (${e.natureza}) - ${e.descricao}`)
                .join("; ")
            : "-",
      },
      { rotulo: "Atenuantes", valor: d.atenuantes.join(", ") || "-" },
      { rotulo: "Agravantes", valor: d.agravantes.join(", ") || "-" },
      {
        rotulo: "Sanção",
        valor: d.sancao ? `${d.sancao}${d.dias ? ` - ${d.dias} dias` : ""}` : "Não aplicável",
      },
    ],
    paragrafos: [
      "A autoridade disciplinar, após a averiguação do fato, a análise das circunstâncias atenuantes e agravantes, das justificativas apresentadas e do comportamento anterior do aluno, DECIDE conforme o resultado acima consignado.",
      `FUNDAMENTAÇÃO: ${d.fundamentacao}`,
      d.sancao
        ? "A aplicação e o cumprimento da sanção observarão a competência da autoridade e o disposto no Regimento. Fica assegurado o prazo de 15 (quinze) dias corridos para pedido de reconsideração, contados da ciência desta decisão, hipótese em que os efeitos da sanção ficarão suspensos até o julgamento."
        : "Não havendo sanção a aplicar, determino o arquivamento do processo individual, preservado o histórico para fins de auditoria.",
    ],
    assinaturas: [
      {
        nome: nomeComPosto(d.autoridade, d.autoridadePosto),
        cargo: d.perfilAutoridade,
      },
    ],
  };
}

// --- DESPACHO DE RECONSIDERACAO --------------------------------------------

export type DadosDespacho = {
  unidade: string;
  numero?: string | null;
  numeroProcesso?: string | null;
  aluno: string;
  sancaoOriginal: string;
  status: string; // DEFERIDA | INDEFERIDA
  parecer: string;
  novaSancao?: string | null;
  novosDias?: number | null;
  autoridade: string;
  autoridadePosto?: string | null;
  perfilAutoridade: string;
  prazoFinal: string | Date;
};

export function modeloDespachoReconsideracao(d: DadosDespacho): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.DESPACHO_RECONSIDERACAO),
    numero: d.numero ?? undefined,
    campos: [
      { rotulo: "Processo", valor: d.numeroProcesso ?? "-" },
      { rotulo: "Aluno", valor: d.aluno },
      { rotulo: "Sanção objeto do pedido", valor: d.sancaoOriginal },
      { rotulo: "Prazo do pedido", valor: dataBR(d.prazoFinal) },
      { rotulo: "Resultado", valor: d.status },
      {
        rotulo: "Sanção após o recurso",
        valor: d.novaSancao
          ? `${d.novaSancao}${d.novosDias ? ` - ${d.novosDias} dias` : ""}`
          : d.status === "DEFERIDA"
            ? "Sanção anulada, sem substituição"
            : "Mantida a sanção original",
      },
    ],
    paragrafos: [
      "Analisado o pedido de reconsideração, no âmbito da competência fixada pelo Regimento segundo a natureza da transgressão, a autoridade profere o seguinte despacho.",
      `PARECER: ${d.parecer}`,
      "A decisão do recurso não agrava a sanção. Cessada a suspensão dos efeitos, retomam-se as providências cabíveis conforme o resultado acima.",
    ],
    assinaturas: [
      {
        nome: nomeComPosto(d.autoridade, d.autoridadePosto),
        cargo: d.perfilAutoridade,
      },
    ],
  };
}

// --- PORTARIA DE AFASTAMENTO CAUTELAR ------------------------------------

export type DadosPortariaAfastamento = {
  unidade: string;
  aluno: string;
  matricula?: string | null;
  justificativa: string;
  inicioEm: string | Date;
  fimPrevisto: string | Date;
  dias: number;
  determinadoPor: string;
};

export function modeloPortariaAfastamento(
  d: DadosPortariaAfastamento,
): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.PORTARIA_AFASTAMENTO),
    campos: [
      { rotulo: "Aluno", valor: `${d.aluno}${d.matricula ? ` (mat. ${d.matricula})` : ""}` },
      { rotulo: "Período", valor: `${dataBR(d.inicioEm)} a ${dataBR(d.fimPrevisto)}` },
      { rotulo: "Dias letivos", valor: String(d.dias) },
    ],
    paragrafos: [
      "O Diretor do Colégio, no uso de suas atribuições e com fundamento no Regimento Escolar, RESOLVE determinar o AFASTAMENTO CAUTELAR do aluno acima identificado, pelo período indicado, prorrogável uma única vez por igual período.",
      `JUSTIFICATIVA: ${d.justificativa}`,
      "O afastamento cautelar NÃO constitui sanção disciplinar. Durante o afastamento fica assegurado ao aluno o acesso às atividades pedagógicas e o direito ao contraditório e à ampla defesa.",
    ],
    assinaturas: [{ nome: d.determinadoPor, cargo: "Diretor - PMBA" }],
  };
}

// --- PARECER DO CONSELHO ------------------------------------------------

export type DadosParecerConselho = {
  unidade: string;
  numero?: string | null;
  aluno: string;
  objeto: string;
  parecer: string;
  recomendacao: string;
  votosFavor: number;
  votosContra: number;
  presidente: string;
};

export function modeloParecerConselho(d: DadosParecerConselho): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.PARECER_CONSELHO),
    numero: d.numero ?? undefined,
    campos: [
      { rotulo: "Aluno", valor: d.aluno },
      { rotulo: "Objeto", valor: d.objeto },
      { rotulo: "Votação", valor: `${d.votosFavor} favoráveis x ${d.votosContra} contrários` },
      { rotulo: "Recomendação", valor: d.recomendacao },
    ],
    paragrafos: [
      "Reunido o Conselho Disciplinar para apreciar a matéria em epígrafe, após a exposição do relator e o debate entre os membros, firmou-se o seguinte parecer.",
      `PARECER: ${d.parecer}`,
      "O presente parecer tem caráter opinativo e será submetido à autoridade competente para deliberação final.",
    ],
    assinaturas: [{ nome: d.presidente, cargo: "Presidente do Conselho Disciplinar" }],
  };
}

// FAD (Ficha de Acompanhamento Disciplinar): tem layout proprio (cards,
// grafico, agrupado por boletim), fora do sistema generico de DocumentoSpec
// usado pelos demais documentos. Ver src/lib/pdf/fad-documento.ts e
// src/modules/disciplina/services/fad-resumo.ts.

// --- ELOGIO ---------------------------------------------------------------

// Mesma regra da comunicacao: um numero, um aluno - elogio ja nasce assim
// nos dados (Elogio.alunoId e singular), entao aqui e so questao de dar a
// ele numeracao oficial e um documento proprio.
export type DadosElogio = {
  unidade: string;
  numero?: string | null;
  aluno: string;
  matricula?: string | null;
  tipoElogio: string;
  valorPontos: number;
  descricao: string;
  concedidoEm: string | Date;
  registradoPor: string;
  registradoPorPosto?: string | null;
};

export function modeloElogio(d: DadosElogio): DocumentoSpec {
  return {
    ...base(d.unidade, TITULO_DOCUMENTO.ELOGIO, [
      "Corpo Discente / Pelotão de Alunos",
    ]),
    numero: d.numero ?? undefined,
    campos: [
      {
        rotulo: "Aluno",
        valor: `${d.aluno}${d.matricula ? ` (mat. ${d.matricula})` : ""}`,
      },
      { rotulo: "Tipo de elogio", valor: d.tipoElogio },
      { rotulo: "Pontos", valor: `+${d.valorPontos.toFixed(2)}` },
      { rotulo: "Data", valor: dataBR(d.concedidoEm) },
      {
        rotulo: "Registrado por",
        valor: nomeComPosto(d.registradoPor, d.registradoPorPosto),
      },
    ],
    paragrafos: [
      "Concedo o elogio a seguir descrito ao(a) aluno(a) acima identificado(a), pela conduta que se destacou positivamente, para constar em seu histórico disciplinar e produzir os efeitos regimentais cabíveis sobre a pontuação de comportamento.",
      `MOTIVO: ${d.descricao}`,
    ],
    assinaturas: [
      {
        nome: nomeComPosto(d.registradoPor, d.registradoPorPosto),
        cargo: "Registrado por",
      },
    ],
  };
}
