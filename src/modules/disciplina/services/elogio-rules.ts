// Numeracao oficial do elogio (mesmo padrao usado pelas demais numeracoes:
// codigo do colegio + escopo + ano + sequencial de 4 digitos). Diferente da
// ocorrencia, o elogio ja nasce um-por-aluno - nao ha "varios alunos numa
// so acao" para desmembrar aqui.
export function formatarNumeroElogio(
  codigoColegio: string,
  ano: number,
  sequencial: number,
): string {
  return `${codigoColegio}-ELG/${ano}/${String(sequencial).padStart(4, "0")}`;
}
