// Camada de apresentacao da FAD redesenhada: a partir do snapshot bruto
// gravado por gerarFichaAction (FichaDisciplinar.conteudo, versionado e
// hasheado), calcula tudo que o layout em cards/grafico/agrupado por
// publicacao precisa. Nao grava nada - e uma funcao pura, recalculada a
// cada renderizacao do PDF.
//
// Processos importados do bancoFad (SEF) tem o relato do fato e o texto da
// natureza colados sem separador (import mecanico, sem o delimitador que o
// sistema de origem tinha). O padrao observado nesses casos e sempre um
// caractere minusculo seguido, sem espaco, de um ponto opcional e uma letra
// maiuscula - e exatamente onde a frase da natureza termina e o relato
// livre comeca. separarNaturezaRelato() usa essa fronteira; processos
// registrados no proprio sistema (sem esse padrao de import) nao tem
// natureza separada do relato, entao caem no fallback (tudo em relato).

const MARCADOR_IMPORTACAO = "Importado do bancoFad";

export type SancaoFicha = {
  tipo: string;
  dias: number | null;
  impacto: number;
  status: string;
  numero: string | null;
  aplicadaEm: string;
};

export type ProcessoFicha = {
  numeroProcesso: string | null;
  status: string;
  ocorrencia: {
    numero: string | null;
    data: string;
    descricao: string;
    comunicante?: { nome: string; posto: string | null } | null;
  };
  sancoes: SancaoFicha[];
};

export type ResumoFadConteudo = {
  totais: {
    processos: number;
    procedentes: number;
    elogios?: number;
    elogiosPontos?: number;
  };
  processos: ProcessoFicha[];
};

function ehImportadoLegado(descricao: string): boolean {
  return descricao.includes(MARCADOR_IMPORTACAO);
}

// Extrai relator/data/texto do relato de um registro importado do bancoFad.
// Formato fixo do import: "Comunicação nº... feita por <NOME> em data de:
// <DD-MM-AAAA> , que relatou:<NATUREZA+RELATO>\n--\nImportado do bancoFad...".
export function extrairContextoLegado(descricao: string): {
  relator: string;
  dataFato: Date | null;
  texto: string;
} | null {
  const m = descricao.match(
    /feita por\s+([\s\S]+?)\s+em data de:\s*(\d{2})-(\d{2})-(\d{4})\s*,\s*que relatou:([\s\S]+?)(?:\n--\n|$)/,
  );
  if (!m) return null;
  const [, relator, dd, mm, aaaa, textoBruto] = m;
  const dataFato = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  return {
    relator: relator.trim(),
    dataFato: Number.isNaN(dataFato.getTime()) ? null : dataFato,
    texto: textoBruto.trim(),
  };
}

// Ve services/fad-resumo.ts (cabecalho do arquivo) pra explicacao da
// heuristica. Nao-greedy: para no primeiro ponto de corte, nao no ultimo.
// Quando nao ha continuacao (o texto TODO e so a frase da natureza, sem
// relato livre depois - caso comum no import), a frase inteira vira
// "natureza" mesmo (com ponto final), nao "relato": senao a mesma frase
// conta como duas categorias diferentes ao tabular a natureza mais
// recorrente (com e sem o ponto final adicionado no outro caminho).
export function separarNaturezaRelato(texto: string): {
  natureza: string | null;
  relato: string;
} {
  const m = texto.match(/^([\s\S]*?[a-zà-üç])\.?([A-ZÀ-Ü][\s\S]*)$/);
  if (!m) {
    const semPontoFinal = texto.trim().replace(/\.+$/, "");
    return { natureza: `${semPontoFinal}.`, relato: "" };
  }
  const natureza = `${m[1].trim()}.`;
  const relato = m[2].trim();
  return { natureza, relato };
}

export type LinhaProcesso = {
  numeroProcesso: string | null;
  data: Date;
  natureza: string | null;
  relato: string;
  relator: string;
  tipoSancao: string | null;
  numeroPublicacao: string | null;
};

function contextoProcesso(p: ProcessoFicha): {
  data: Date;
  natureza: string | null;
  relato: string;
  relator: string;
} {
  const legado = ehImportadoLegado(p.ocorrencia.descricao)
    ? extrairContextoLegado(p.ocorrencia.descricao)
    : null;

  if (legado) {
    const { natureza, relato } = separarNaturezaRelato(legado.texto);
    return {
      data: legado.dataFato ?? new Date(p.ocorrencia.data),
      natureza,
      relato,
      relator: legado.relator,
    };
  }

  const comunicante = p.ocorrencia.comunicante;
  const relator = comunicante
    ? [comunicante.posto, comunicante.nome].filter(Boolean).join(" ")
    : "-";
  return {
    data: new Date(p.ocorrencia.data),
    natureza: null,
    relato: p.ocorrencia.descricao.trim(),
    relator,
  };
}

function linhaDe(p: ProcessoFicha): LinhaProcesso {
  const ctx = contextoProcesso(p);
  const sancao = p.sancoes.find((s) => s.status !== "ANULADA") ?? p.sancoes[0];
  return {
    numeroProcesso: p.numeroProcesso,
    data: ctx.data,
    natureza: ctx.natureza,
    relato: ctx.relato,
    relator: ctx.relator,
    tipoSancao: sancao?.tipo ?? null,
    numeroPublicacao: sancao?.numero ?? null,
  };
}

// Ordem do mais grave (topo) pro mais leve (base), como no modelo. So entram
// tipos com pelo menos 1 ocorrencia - sem barras zeradas.
const ORDEM_SEVERIDADE = [
  "TRANSFERENCIA_COMPULSORIA",
  "SUSPENSAO_COM_PREJUIZO",
  "SUSPENSAO_SEM_PREJUIZO",
  "IMPEDIMENTO",
  "REPREENSAO",
  "ADVERTENCIA",
];

export const NOME_TIPO_SANCAO: Record<string, string> = {
  TRANSFERENCIA_COMPULSORIA: "Transferência compulsória",
  SUSPENSAO_COM_PREJUIZO: "Suspensão (com prejuízo)",
  SUSPENSAO_SEM_PREJUIZO: "Suspensão (sem prejuízo)",
  IMPEDIMENTO: "Impedimento",
  REPREENSAO: "Repreensão",
  ADVERTENCIA: "Advertência",
};

// Versao curta pra caber no selo/badge da tabela (coluna estreita).
export const NOME_CURTO_TIPO_SANCAO: Record<string, string> = {
  TRANSFERENCIA_COMPULSORIA: "TRANSF. COMPULS.",
  SUSPENSAO_COM_PREJUIZO: "SUSP. C/ PREJ.",
  SUSPENSAO_SEM_PREJUIZO: "SUSP. S/ PREJ.",
  IMPEDIMENTO: "IMPEDIMENTO",
  REPREENSAO: "REPREENSÃO",
  ADVERTENCIA: "ADVERTÊNCIA",
};

export type BarraDistribuicao = { codigo: string; nome: string; qtd: number };

export function distribuicaoPorTipoSancao(
  linhas: LinhaProcesso[],
): BarraDistribuicao[] {
  const contagem = new Map<string, number>();
  for (const linha of linhas) {
    if (!linha.tipoSancao) continue;
    contagem.set(linha.tipoSancao, (contagem.get(linha.tipoSancao) ?? 0) + 1);
  }
  return ORDEM_SEVERIDADE.filter((codigo) => contagem.has(codigo)).map(
    (codigo) => ({
      codigo,
      nome: NOME_TIPO_SANCAO[codigo] ?? codigo,
      qtd: contagem.get(codigo) ?? 0,
    }),
  );
}

export function naturezaMaisRecorrente(
  linhas: LinhaProcesso[],
): { texto: string; qtd: number } | null {
  const contagem = new Map<string, number>();
  for (const linha of linhas) {
    const chave = (linha.natureza ?? linha.relato).trim();
    if (!chave) continue;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  let melhor: { texto: string; qtd: number } | null = null;
  for (const [texto, qtd] of contagem) {
    if (!melhor || qtd > melhor.qtd) melhor = { texto, qtd };
  }
  return melhor;
}

export type GrupoPublicacao = {
  chave: string;
  processos: LinhaProcesso[];
  dataInicio: Date;
  dataFim: Date;
};

const SEM_PUBLICACAO = "Sem publicação registrada";

export function agruparPorPublicacao(
  linhas: LinhaProcesso[],
): GrupoPublicacao[] {
  const grupos = new Map<string, LinhaProcesso[]>();
  for (const linha of linhas) {
    const chave = linha.numeroPublicacao ?? SEM_PUBLICACAO;
    const lista = grupos.get(chave) ?? [];
    lista.push(linha);
    grupos.set(chave, lista);
  }
  const resultado: GrupoPublicacao[] = [];
  for (const [chave, processos] of grupos) {
    const ordenados = [...processos].sort(
      (a, b) => a.data.getTime() - b.data.getTime(),
    );
    resultado.push({
      chave,
      processos: ordenados,
      dataInicio: ordenados[0].data,
      dataFim: ordenados[ordenados.length - 1].data,
    });
  }
  // Ordena pelo numero do boletim (ex.: "BIC 4" antes de "BIC 16"), nao pela
  // data - os BICs sao publicacoes sequenciais e a ordem numerica delas e
  // que importa, mesmo que, por algum motivo, um processo de um BIC mais
  // novo tenha sido registrado com data anterior a um de BIC mais antigo.
  const numeroDoBic = (chave: string): number => {
    const m = chave.match(/(\d+)\s*$/);
    return m ? Number(m[1]) : Number.POSITIVE_INFINITY;
  };
  resultado.sort((a, b) => {
    if (a.chave === SEM_PUBLICACAO) return 1;
    if (b.chave === SEM_PUBLICACAO) return -1;
    const diff = numeroDoBic(a.chave) - numeroDoBic(b.chave);
    return diff !== 0 ? diff : a.dataInicio.getTime() - b.dataInicio.getTime();
  });
  return resultado;
}

export type ResumoFad = {
  contadores: {
    processos: number;
    procedentes: number;
    publicacoes: number;
    impedimentosSuspensoes: number;
    elogios: number;
    elogiosPontos: number;
  };
  distribuicao: BarraDistribuicao[];
  naturezaRecorrente: { texto: string; qtd: number; total: number } | null;
  grupos: GrupoPublicacao[];
};

const TIPOS_IMPEDIMENTO_SUSPENSAO = new Set([
  "IMPEDIMENTO",
  "SUSPENSAO_SEM_PREJUIZO",
  "SUSPENSAO_COM_PREJUIZO",
]);

export function construirResumoFad(conteudo: ResumoFadConteudo): ResumoFad {
  const linhas = conteudo.processos.map(linhaDe);
  const distribuicao = distribuicaoPorTipoSancao(linhas);
  const publicacoes = new Set(
    linhas.map((l) => l.numeroPublicacao).filter((v): v is string => !!v),
  );
  const impedimentosSuspensoes = linhas.filter(
    (l) => l.tipoSancao && TIPOS_IMPEDIMENTO_SUSPENSAO.has(l.tipoSancao),
  ).length;
  const recorrente = naturezaMaisRecorrente(linhas);

  return {
    contadores: {
      processos: conteudo.totais.processos,
      procedentes: conteudo.totais.procedentes,
      publicacoes: publicacoes.size,
      impedimentosSuspensoes,
      elogios: conteudo.totais.elogios ?? 0,
      elogiosPontos: conteudo.totais.elogiosPontos ?? 0,
    },
    distribuicao,
    naturezaRecorrente: recorrente
      ? { ...recorrente, total: conteudo.totais.procedentes }
      : null,
    grupos: agruparPorPublicacao(linhas),
  };
}
