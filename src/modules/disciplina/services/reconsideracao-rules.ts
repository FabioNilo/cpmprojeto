import {
  NATUREZA_ORDEM,
  type NaturezaTransgressao,
} from "../constants";
import type { StatusSancao } from "./sancao-rules";

// anexoA secao 12: 15 dias corridos apos a ciencia/publicacao.
export const PRAZO_RECONSIDERACAO_DIAS = 15;

export type StatusReconsideracao =
  | "PENDENTE"
  | "DEFERIDA"
  | "INDEFERIDA"
  | "ENCERRADA";

export function prazoFinalReconsideracao(referencia: Date): Date {
  const alvo = new Date(referencia);
  alvo.setDate(alvo.getDate() + PRAZO_RECONSIDERACAO_DIAS);
  return alvo;
}

export function dentroDoPrazoReconsideracao(
  referencia: Date,
  agora: Date,
): boolean {
  return agora.getTime() <= prazoFinalReconsideracao(referencia).getTime();
}

export function podeSolicitarReconsideracao(
  statusSancao: StatusSancao,
  jaTemPendente: boolean,
): boolean {
  if (jaTemPendente) {
    return false;
  }
  return (
    statusSancao === "ATIVA" ||
    statusSancao === "SUSPENSA" ||
    statusSancao === "CUMPRIDA"
  );
}

export function podeDecidirReconsideracao(
  status: StatusReconsideracao,
): boolean {
  return status === "PENDENTE";
}

// anexoA secao 12: LEVE -> Chefe; MEDIA -> Adjunto; GRAVE/ELIMINATORIA -> Diretor PM.
// Modelado via competencias_disciplinares (tipoAto DECIDIR_RECONSIDERACAO, naturezaMax).
export type CompetenciaReconsideracao = {
  perfilCodigo: string;
  naturezaMax: NaturezaTransgressao | null;
};

export function perfilPodeDecidirReconsideracao(
  natureza: NaturezaTransgressao,
  competencias: readonly CompetenciaReconsideracao[],
): boolean {
  return competencias.some(
    (c) =>
      c.naturezaMax !== null &&
      NATUREZA_ORDEM[natureza] <= NATUREZA_ORDEM[c.naturezaMax],
  );
}

export function perfilDecisorReconsideracao(
  natureza: NaturezaTransgressao,
  competencias: readonly CompetenciaReconsideracao[],
): string | null {
  const escolhida = competencias
    .filter(
      (c) =>
        c.naturezaMax !== null &&
        NATUREZA_ORDEM[natureza] <= NATUREZA_ORDEM[c.naturezaMax],
    )
    .sort(
      (a, b) => NATUREZA_ORDEM[a.naturezaMax!] - NATUREZA_ORDEM[b.naturezaMax!],
    );
  return escolhida[0]?.perfilCodigo ?? null;
}

// anexoA secao 12: a decisao do recurso NAO pode agravar a sancao.
export function agravaSancao(
  ordemAtual: number,
  diasAtuais: number | null,
  novaOrdem: number,
  novosDias: number | null,
): boolean {
  if (novaOrdem > ordemAtual) {
    return true;
  }
  if (novaOrdem === ordemAtual && novosDias !== null) {
    const base = diasAtuais ?? 0;
    return novosDias > base;
  }
  return false;
}

export function formatarNumeroDespacho(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}-DESP/${ano}/${String(sequencial).padStart(4, "0")}`;
}
