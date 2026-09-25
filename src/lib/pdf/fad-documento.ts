import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { quebrarLinhas, sanitizar } from "./pm-documento";
import {
  NOME_CURTO_TIPO_SANCAO,
  type ResumoFad,
} from "@/modules/disciplina/services/fad-resumo";

export type DadosFadRedesenhada = {
  unidade: string;
  aluno: string;
  matricula: string | null;
  turmaAno: string | null;
  saldo: number;
  faixaNome: string | null;
  faixaCodigo: string | null;
  versao: number;
  hash: string;
  geradoEm: Date;
  resumo: ResumoFad;
};

const A4 = { w: 595.28, h: 841.89 };
const MARGEM = 40;
const LARGURA_UTIL = A4.w - MARGEM * 2;

const NAVY = rgb(0.09, 0.13, 0.24);
const NAVY_CLARO = rgb(0.94, 0.95, 0.97);
const CINZA_BORDA = rgb(0.82, 0.84, 0.88);
const CINZA_TEXTO = rgb(0.42, 0.45, 0.5);
const PRETO_TEXTO = rgb(0.13, 0.15, 0.2);
const BRANCO = rgb(1, 1, 1);
const ZEBRA = rgb(0.97, 0.975, 0.98);

const COR_SANCAO: Record<string, ReturnType<typeof rgb>> = {
  TRANSFERENCIA_COMPULSORIA: rgb(0.3, 0.04, 0.09),
  SUSPENSAO_COM_PREJUIZO: rgb(0.55, 0.09, 0.11),
  SUSPENSAO_SEM_PREJUIZO: rgb(0.75, 0.24, 0.22),
  IMPEDIMENTO: rgb(0.8, 0.42, 0.16),
  REPREENSAO: rgb(0.83, 0.6, 0.2),
  ADVERTENCIA: rgb(0.55, 0.58, 0.63),
};

const COR_FAIXA: Record<string, ReturnType<typeof rgb>> = {
  EXCEPCIONAL: rgb(0.14, 0.5, 0.29),
  OTIMO: rgb(0.14, 0.5, 0.29),
  BOM: rgb(0.14, 0.5, 0.29),
  REGULAR: rgb(0.78, 0.55, 0.1),
  INSUFICIENTE: rgb(0.75, 0.24, 0.22),
  INCOMPATIVEL: rgb(0.55, 0.09, 0.11),
};

function corFaixa(codigo: string | null): ReturnType<typeof rgb> {
  return (codigo && COR_FAIXA[codigo]) || PRETO_TEXTO;
}

function corSancao(tipo: string | null): ReturnType<typeof rgb> {
  return (tipo && COR_SANCAO[tipo]) || CINZA_TEXTO;
}

function dataBR(d: Date): string {
  return d.toLocaleDateString("pt-BR");
}

export async function renderizarFad(
  dados: DadosFadRedesenhada,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Ficha de Acompanhamento Disciplinar - ${dados.aluno}`);
  doc.setProducer("Sistema Disciplinar CPM");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = doc.addPage([A4.w, A4.h]);
  let y = A4.h;
  const paginas: PDFPage[] = [page];

  const novaPagina = () => {
    page = doc.addPage([A4.w, A4.h]);
    paginas.push(page);
    y = A4.h - MARGEM;
  };
  const garantirEspaco = (altura: number) => {
    if (y - altura < MARGEM + 24) novaPagina();
  };

  const texto = (
    t: string,
    x: number,
    yPos: number,
    size: number,
    font: PDFFont,
    cor = PRETO_TEXTO,
  ) => {
    page.drawText(sanitizar(t), { x, y: yPos, size, font, color: cor });
  };
  const textoDireita = (
    t: string,
    xDireita: number,
    yPos: number,
    size: number,
    font: PDFFont,
    cor = PRETO_TEXTO,
  ) => {
    const s = sanitizar(t);
    const w = font.widthOfTextAtSize(s, size);
    page.drawText(s, { x: xDireita - w, y: yPos, size, font, color: cor });
  };

  // ---- Cabecalho (banner navy) -----------------------------------------
  const alturaBanner = 78;
  page.drawRectangle({ x: 0, y: A4.h - alturaBanner, width: A4.w, height: alturaBanner, color: NAVY });
  texto("FICHA DE ACOMPANHAMENTO DISCIPLINAR", MARGEM, A4.h - 38, 19, bold, BRANCO);
  texto(dados.unidade, MARGEM, A4.h - 58, 10.5, regular, rgb(0.75, 0.79, 0.87));
  y = A4.h - alturaBanner - 20;

  // ---- Barra de identificacao (aluno / matricula / turma / saldo) -----
  const alturaInfo = 46;
  garantirEspaco(alturaInfo + 12);
  page.drawRectangle({
    x: MARGEM,
    y: y - alturaInfo,
    width: LARGURA_UTIL,
    height: alturaInfo,
    color: NAVY_CLARO,
    borderColor: CINZA_BORDA,
    borderWidth: 1,
  });
  const colsInfo = [
    { titulo: "ALUNO", valor: dados.aluno, largura: 0.42 },
    { titulo: "MATRÍCULA", valor: dados.matricula ?? "-", largura: 0.16 },
    { titulo: "TURMA / ANO", valor: dados.turmaAno ?? "-", largura: 0.2 },
    {
      titulo: "SALDO DE COMPORTAMENTO",
      valor: `${dados.saldo.toFixed(2)}${dados.faixaNome ? ` - ${dados.faixaNome.toUpperCase()}` : ""}`,
      largura: 0.22,
    },
  ];
  let xCol = MARGEM + 14;
  colsInfo.forEach((col, i) => {
    const largura = col.largura * (LARGURA_UTIL - 28);
    texto(col.titulo, xCol, y - 16, 7.5, bold, CINZA_TEXTO);
    const cor = i === 3 ? corFaixa(dados.faixaCodigo) : PRETO_TEXTO;
    const linhasValor = quebrarLinhas(col.valor, bold, 11, largura);
    texto(linhasValor[0] ?? "", xCol, y - 30, 11, bold, cor);
    if (linhasValor[1]) texto(linhasValor[1], xCol, y - 42, 9, bold, cor);
    xCol += largura + 14;
  });
  y -= alturaInfo + 16;

  // ---- Cards de resumo ---------------------------------------------
  const cards = [
    { numero: String(dados.resumo.contadores.processos), rotulo: "PROCESSOS REGISTRADOS" },
    {
      numero: `${dados.resumo.contadores.procedentes}/${dados.resumo.contadores.processos}`,
      rotulo: "PROCEDENTES",
    },
    { numero: String(dados.resumo.contadores.publicacoes), rotulo: "BOLETINS ENVOLVIDOS" },
    {
      numero: String(dados.resumo.contadores.impedimentosSuspensoes),
      rotulo: "IMPEDIMENTOS / SUSPENSÕES",
    },
    {
      numero: `${dados.resumo.contadores.elogios} (+${dados.resumo.contadores.elogiosPontos.toFixed(2)})`,
      rotulo: "ELOGIOS CONCEDIDOS",
    },
  ];
  const alturaCard = 56;
  garantirEspaco(alturaCard + 14);
  const gap = 10;
  const larguraCard = (LARGURA_UTIL - gap * (cards.length - 1)) / cards.length;
  cards.forEach((c, i) => {
    const x = MARGEM + i * (larguraCard + gap);
    page.drawRectangle({
      x,
      y: y - alturaCard,
      width: larguraCard,
      height: alturaCard,
      borderColor: CINZA_BORDA,
      borderWidth: 1,
    });
    const numW = bold.widthOfTextAtSize(c.numero, 20);
    texto(c.numero, x + (larguraCard - numW) / 2, y - 28, 20, bold, NAVY);
    const linhasRotulo = quebrarLinhas(c.rotulo, regular, 7.5, larguraCard - 10);
    linhasRotulo.slice(0, 2).forEach((linha, li) => {
      const w = regular.widthOfTextAtSize(linha, 7.5);
      texto(linha, x + (larguraCard - w) / 2, y - 42 - li * 10, 7.5, regular, CINZA_TEXTO);
    });
  });
  y -= alturaCard + 22;

  // ---- Distribuicao por tipo de sancao (grafico de barras) ----------
  if (dados.resumo.distribuicao.length > 0) {
    garantirEspaco(20);
    texto("DISTRIBUIÇÃO POR TIPO DE SANÇÃO", MARGEM, y, 11, bold, NAVY);
    y -= 16;
    const maxQtd = Math.max(...dados.resumo.distribuicao.map((d) => d.qtd));
    const larguraRotulo = 150;
    const larguraNumero = 30;
    const larguraBarraMax = LARGURA_UTIL - larguraRotulo - larguraNumero - 10;
    for (const barra of dados.resumo.distribuicao) {
      garantirEspaco(16);
      texto(barra.nome, MARGEM, y - 9, 9.5, regular, PRETO_TEXTO);
      const larguraBarra = Math.max(4, (barra.qtd / maxQtd) * larguraBarraMax);
      page.drawRectangle({
        x: MARGEM + larguraRotulo,
        y: y - 12,
        width: larguraBarra,
        height: 11,
        color: corSancao(barra.codigo),
      });
      texto(
        String(barra.qtd),
        MARGEM + larguraRotulo + larguraBarra + 6,
        y - 9,
        9.5,
        bold,
        PRETO_TEXTO,
      );
      y -= 18;
    }
    y -= 4;
  }

  if (dados.resumo.naturezaRecorrente) {
    garantirEspaco(14);
    const r = dados.resumo.naturezaRecorrente;
    const prefixo = "Natureza mais recorrente: ";
    texto(prefixo, MARGEM, y, 9, regular, CINZA_TEXTO);
    const offset = regular.widthOfTextAtSize(prefixo, 9);
    const linhas = quebrarLinhas(
      `${r.texto} (${r.qtd} ocorrências de ${r.total}).`,
      bold,
      9,
      LARGURA_UTIL - offset,
    );
    texto(linhas[0] ?? "", MARGEM + offset, y, 9, bold, PRETO_TEXTO);
    y -= 12;
    for (const linha of linhas.slice(1)) {
      texto(linha, MARGEM, y, 9, bold, PRETO_TEXTO);
      y -= 12;
    }
    y -= 10;
  }

  // ---- Historico por boletim -----------------------------------------
  garantirEspaco(30);
  texto("HISTÓRICO POR BOLETIM DE PUBLICAÇÃO", MARGEM, y, 11, bold, NAVY);
  y -= 14;
  for (const linha of quebrarLinhas(
    "Os processos abaixo estão agrupados pelo boletim em que foram publicados, em ordem cronológica. Cada linha resume o essencial da comunicação; use os códigos de processo para localizar o processo completo no sistema.",
    regular,
    8.5,
    LARGURA_UTIL,
  )) {
    garantirEspaco(11);
    texto(linha, MARGEM, y, 8.5, regular, CINZA_TEXTO);
    y -= 11;
  }
  y -= 8;

  // Colunas da tabela por grupo
  const colX = {
    processo: MARGEM,
    natureza: MARGEM + 92,
    sancao: MARGEM + LARGURA_UTIL - 185,
    relator: MARGEM + LARGURA_UTIL - 78,
  };
  const larguraNatureza = colX.sancao - colX.natureza - 8;
  const larguraRelator = MARGEM + LARGURA_UTIL - colX.relator;

  const cabecalhoTabela = () => {
    garantirEspaco(20);
    page.drawRectangle({ x: MARGEM, y: y - 14, width: LARGURA_UTIL, height: 16, color: NAVY_CLARO });
    texto("PROCESSO / DATA", colX.processo + 4, y - 10, 7.5, bold, CINZA_TEXTO);
    texto("NATUREZA E RELATO", colX.natureza, y - 10, 7.5, bold, CINZA_TEXTO);
    texto("SANÇÃO", colX.sancao, y - 10, 7.5, bold, CINZA_TEXTO);
    texto("RELATOR", colX.relator, y - 10, 7.5, bold, CINZA_TEXTO);
    y -= 20;
  };

  for (const grupo of dados.resumo.grupos) {
    garantirEspaco(38);
    page.drawRectangle({ x: MARGEM, y: y - 18, width: LARGURA_UTIL, height: 20, color: NAVY });
    texto(grupo.chave.toUpperCase(), MARGEM + 8, y - 13, 9.5, bold, BRANCO);
    textoDireita(
      `${grupo.processos.length} processo(s) - ${dataBR(grupo.dataInicio)} a ${dataBR(grupo.dataFim)}`,
      MARGEM + LARGURA_UTIL - 8,
      y - 13,
      8.5,
      regular,
      rgb(0.8, 0.83, 0.9),
    );
    y -= 24;
    cabecalhoTabela();

    let zebraIndex = 0;
    for (const p of grupo.processos) {
      const linhasNatureza = p.natureza
        ? quebrarLinhas(p.natureza, bold, 8.5, larguraNatureza)
        : [];
      const linhasRelato = p.relato
        ? quebrarLinhas(p.relato, regular, 8.5, larguraNatureza)
        : [];
      const linhasRelator = quebrarLinhas(p.relator, regular, 7.5, larguraRelator);
      const totalLinhas = Math.max(
        1,
        linhasNatureza.length + linhasRelato.length,
        linhasRelator.length,
      );
      const alturaLinha = 11 * totalLinhas + 10;

      if (y - alturaLinha < MARGEM + 24) {
        novaPagina();
        cabecalhoTabela();
      }

      if (zebraIndex % 2 === 1) {
        page.drawRectangle({
          x: MARGEM,
          y: y - alturaLinha + 2,
          width: LARGURA_UTIL,
          height: alturaLinha - 2,
          color: ZEBRA,
        });
      }
      zebraIndex += 1;

      const yLinha = y - 10;
      texto(p.numeroProcesso ?? "-", colX.processo + 4, yLinha, 8.5, bold, PRETO_TEXTO);
      texto(dataBR(p.data), colX.processo + 4, yLinha - 11, 7.5, regular, CINZA_TEXTO);

      let yTexto = y - 10;
      for (const linha of linhasNatureza) {
        texto(linha, colX.natureza, yTexto, 8.5, bold, PRETO_TEXTO);
        yTexto -= 11;
      }
      for (const linha of linhasRelato) {
        texto(linha, colX.natureza, yTexto, 8.5, regular, PRETO_TEXTO);
        yTexto -= 11;
      }

      if (p.tipoSancao) {
        const nome = sanitizar(
          NOME_CURTO_TIPO_SANCAO[p.tipoSancao] ?? p.tipoSancao.replaceAll("_", " "),
        );
        page.drawRectangle({
          x: colX.sancao - 4,
          y: y - 14,
          width: bold.widthOfTextAtSize(nome, 6.5) + 10,
          height: 13,
          color: corSancao(p.tipoSancao),
        });
        texto(nome, colX.sancao, y - 10.5, 6.5, bold, BRANCO);
      }

      let yRelator = y - 10;
      for (const linha of linhasRelator) {
        texto(linha, colX.relator, yRelator, 7.5, regular, CINZA_TEXTO);
        yRelator -= 10;
      }

      y -= alturaLinha;
    }
    y -= 10;
  }

  if (dados.resumo.grupos.length === 0) {
    texto("Nenhum processo disciplinar registrado para este aluno.", MARGEM, y, 9.5, italic, CINZA_TEXTO);
    y -= 16;
  }

  // ---- Rodape (nota final + hash em todas as paginas) ------------------
  garantirEspaco(30);
  for (const linha of quebrarLinhas(
    "Esta ficha é um retrato, na data de emissão, do histórico disciplinar do aluno, reconstruído a partir do livro-razão de movimentações de comportamento. Documento versionado e identificado por hash para conferência de integridade (ver rodapé).",
    italic,
    8,
    LARGURA_UTIL,
  )) {
    garantirEspaco(11);
    texto(linha, MARGEM, y, 8, italic, CINZA_TEXTO);
    y -= 11;
  }

  const total = paginas.length;
  const rodapeEsquerda = `Ficha de Acompanhamento Disciplinar - Matrícula ${dados.matricula ?? "-"} - Gerada em ${dados.geradoEm.toLocaleString("pt-BR")}`;
  const rodapeHash = `Hash SHA-256: ${dados.hash} - Versão ${dados.versao} - Minuta gerada pelo Sistema Disciplinar CPM`;
  paginas.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGEM, y: MARGEM - 8 },
      end: { x: A4.w - MARGEM, y: MARGEM - 8 },
      thickness: 0.5,
      color: CINZA_BORDA,
    });
    p.drawText(sanitizar(rodapeEsquerda), { x: MARGEM, y: MARGEM - 20, size: 6.5, font: regular, color: CINZA_TEXTO });
    p.drawText(sanitizar(rodapeHash), { x: MARGEM, y: MARGEM - 30, size: 6.5, font: regular, color: CINZA_TEXTO });
    const paginaTxt = `Página ${i + 1} de ${total}`;
    const w = regular.widthOfTextAtSize(paginaTxt, 7);
    p.drawText(paginaTxt, { x: A4.w - MARGEM - w, y: MARGEM - 20, size: 7, font: regular, color: CINZA_TEXTO });
  });

  return doc.save();
}
