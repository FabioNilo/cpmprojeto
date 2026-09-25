// Monta o titulo/mensagem da notificacao automatica de comunicacao
// disciplinar, gerada no envio de uma ocorrencia (ver enviarOcorrenciaAction).
// Funcao pura, nao grava nada.
export function construirNotificacaoComunicacao(input: {
  tipoOcorrencia: string;
  numeroProcesso: string | null;
  alunoNome: string;
}): { titulo: string; mensagem: string } {
  const titulo = input.numeroProcesso
    ? `Nova comunicação disciplinar — ${input.numeroProcesso}`
    : "Nova comunicação disciplinar";
  const mensagem =
    `Foi registrada uma comunicação disciplinar (${input.tipoOcorrencia}) envolvendo ${input.alunoNome}. ` +
    "Acesse o portal para ver os detalhes e, se cabível, apresentar manifestação.";
  return { titulo, mensagem };
}
