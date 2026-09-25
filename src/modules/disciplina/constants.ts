export const NATUREZAS_TRANSGRESSAO = [
  "LEVE",
  "MEDIA",
  "GRAVE",
  "ELIMINATORIA",
] as const;
export type NaturezaTransgressao = (typeof NATUREZAS_TRANSGRESSAO)[number];

export const TIPOS_ATO_COMPETENCIA = [
  "APLICAR_SANCAO",
  "DECIDIR_RECONSIDERACAO",
] as const;

export const UNIDADES_PRAZO = ["HORAS", "DIAS_CORRIDOS", "DIAS_LETIVOS"] as const;

export const TIPOS_OCORRENCIA = [
  "DISCIPLINAR",
  "FALTA_ESCOLAR",
  "ATRASO_ESCOLAR",
] as const;
export type TipoOcorrencia = (typeof TIPOS_OCORRENCIA)[number];

// anexoA.txt secao 10: o prazo de 48h e so para falta/atraso escolar.
export const TIPOS_OCORRENCIA_COM_PRAZO_48H: readonly TipoOcorrencia[] = [
  "FALTA_ESCOLAR",
  "ATRASO_ESCOLAR",
];

export const STATUS_OCORRENCIA = [
  "RASCUNHO",
  "ENVIADA",
  "EM_AVERIGUACAO",
  "AGUARDANDO_MANIFESTACAO",
  "AGUARDANDO_CIENCIA",
  "EM_ANALISE",
  "DECIDIDA",
  "ENCERRADA",
  "ARQUIVADA",
] as const;
export type StatusOcorrencia = (typeof STATUS_OCORRENCIA)[number];

export const STATUS_PROCESSO_ALUNO = [
  "PENDENTE",
  "JUSTIFICADO",
  "PROCEDENTE",
  "IMPROCEDENTE",
  "ARQUIVADO",
] as const;
export type StatusProcessoAluno = (typeof STATUS_PROCESSO_ALUNO)[number];

export const TIPOS_MANIFESTACAO = [
  "JUSTIFICACAO",
  "DEFESA",
  "ESCLARECIMENTO",
  "COMPLEMENTACAO",
] as const;
export type TipoManifestacao = (typeof TIPOS_MANIFESTACAO)[number];

export const MEIOS_CIENCIA = [
  "PORTAL",
  "PRESENCIAL",
  "TELEFONE",
  "RECUSA",
] as const;
export type MeioCiencia = (typeof MEIOS_CIENCIA)[number];

// anexoA.txt secoes 2 e 4: a autoridade enquadra o fato numa transgressao e
// decide. ENCAMINHADO_SINDICANCIA mantem o processo aberto (rito de D8).
export const RESULTADOS_DECISAO = [
  "PROCEDENTE",
  "IMPROCEDENTE",
  "ARQUIVADO",
  "ENCAMINHADO_SINDICANCIA",
] as const;
export type ResultadoDecisao = (typeof RESULTADOS_DECISAO)[number];

// Ordem crescente de gravidade (anexoA.txt secao 2).
export const NATUREZA_ORDEM: Record<NaturezaTransgressao, number> = {
  LEVE: 1,
  MEDIA: 2,
  GRAVE: 3,
  ELIMINATORIA: 4,
};

export const MOVIMENTO_PONTUACAO_TIPOS = [
  "SANCAO",
  "ELOGIO",
  "RESTAURACAO_SANCAO",
  "BONIFICACAO_ANUAL",
  "AJUSTE_ADMINISTRATIVO",
] as const;

// anexoA.txt secao 8: todo aluno comeca com 8.00 (faixa BOM);
// saldo exibido fica entre 0.00 e 10.00.
export const PONTUACAO_INICIAL = 8.0;
export const SALDO_MINIMO = 0.0;
export const SALDO_MAXIMO = 10.0;

// anexoA.txt secao 8: abaixo de 6.00 -> acompanhamento + ciencia da familia.
export const LIMITE_ACOMPANHAMENTO = 6.0;
