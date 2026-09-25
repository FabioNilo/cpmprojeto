import type { ResultadoDecisao } from "../constants";

export type StatusSancao = "ATIVA" | "SUSPENSA" | "ANULADA" | "CUMPRIDA";

// So se aplica sancao a partir de uma decisao PROCEDENTE ativa que ainda nao
// tenha sancao vigente (anexoA regra central).
export function podeAplicarSancao(
  resultadoDecisao: ResultadoDecisao,
  decisaoRevogada: boolean,
  jaTemSancaoNaoAnulada: boolean,
): boolean {
  return (
    resultadoDecisao === "PROCEDENTE" &&
    !decisaoRevogada &&
    !jaTemSancaoNaoAnulada
  );
}

export function podeAnularSancao(status: StatusSancao): boolean {
  return status === "ATIVA" || status === "SUSPENSA" || status === "CUMPRIDA";
}

export function podeRegistrarCumprimento(status: StatusSancao): boolean {
  return status === "ATIVA";
}

// anexoA secao 12: reconsideracao pendente suspende os efeitos da sancao.
export function podeSuspenderEfeitos(status: StatusSancao): boolean {
  return status === "ATIVA";
}

export function podeRetomarEfeitos(status: StatusSancao): boolean {
  return status === "SUSPENSA";
}

export type ResolucaoImpactoSancao = {
  impactoPontos: number;
  impactoManual: boolean;
};

// Aluno com necessidadeEspecial (neurodivergencia) pode ter o impacto em
// pontos ajustado manualmente em vez do valor fixo do catalogo — pedido
// pedagogico para nao aplicar a mesma escala de desconto automaticamente.
// Alunos sem essa marcacao sempre usam o valor do catalogo, mesmo que um
// valor manual venha preenchido no formulario (ignorado nesse caso).
export function resolverImpactoSancao(
  necessidadeEspecial: boolean,
  impactoCatalogo: number,
  impactoManualInformado: number | null,
): ResolucaoImpactoSancao {
  if (necessidadeEspecial && impactoManualInformado !== null) {
    return { impactoPontos: impactoManualInformado, impactoManual: true };
  }
  return { impactoPontos: impactoCatalogo, impactoManual: false };
}

// Numeracao provisoria do boletim de publicacao (EO), reinicio anual por CPM.
export function formatarNumeroPublicacao(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}-BI/${ano}/${String(sequencial).padStart(4, "0")}`;
}
