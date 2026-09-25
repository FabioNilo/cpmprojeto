import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

export type Assinatura = { nome: string; cargo?: string };
export type CampoDoc = { rotulo: string; valor: string };

export type DocumentoSpec = {
  // Cabecalho: instituicao em cima, subtitulos institucionais fixos (opcional),
  // unidade (CPM) por ultimo.
  cabecalhoInstituicao: string;
  cabecalhoSubtitulos?: string[];
  cabecalhoUnidade: string;
  titulo: string;
  numero?: string;
  campos: CampoDoc[];
  paragrafos: string[];
  assinaturas: Assinatura[];
  rodape?: string;
};

const ASPAS_SIMPLES = /[‘’‚‛]/g;
const ASPAS_DUPLAS = /[“”„‟]/g;
const TRACOS = /[‐-―−]/g;
const RETICENCIAS = /…/g;
const ESPACOS_ESPECIAIS = /[    ]/g;
const BULLETS = /[•●▪·]/g;
const FORA_LATIN1 = /[^ -ÿ]/g;

// pdf-lib com fontes padrao usa WinAnsi (Latin-1). Normaliza caracteres
// tipograficos e remove o que estiver fora do Latin-1 imprimivel.
// Nao preserva quebras de linha: quem chama trata "\n" antes.
export function sanitizar(texto: string): string {
  return texto
    .replace(ASPAS_SIMPLES, "'")
    .replace(ASPAS_DUPLAS, '"')
    .replace(TRACOS, "-")
    .replace(RETICENCIAS, "...")
    .replace(ESPACOS_ESPECIAIS, " ")
    .replace(BULLETS, "-")
    .replace(FORA_LATIN1, "");
}

export function quebrarLinhas(
  texto: string,
  font: PDFFont,
  size: number,
  larguraMax: number,
): string[] {
  const linhas: string[] = [];
  for (const bruto of texto.split("\n").map(sanitizar)) {
    const palavras = bruto.split(/\s+/).filter(Boolean);
    if (palavras.length === 0) {
      linhas.push("");
      continue;
    }
    let atual = "";
    for (const palavra of palavras) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (font.widthOfTextAtSize(tentativa, size) <= larguraMax) {
        atual = tentativa;
      } else {
        if (atual) linhas.push(atual);
        atual = palavra;
      }
    }
    if (atual) linhas.push(atual);
  }
  return linhas;
}

export async function renderizarDocumentoPM(
  spec: DocumentoSpec,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${spec.titulo}${spec.numero ? ` ${spec.numero}` : ""}`);
  doc.setProducer("Sistema Disciplinar CPM");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const A4 = { w: 595.28, h: 841.89 };
  const margem = 56;
  const larguraUtil = A4.w - margem * 2;
  const preto = rgb(0.1, 0.12, 0.18);
  const cinza = rgb(0.4, 0.44, 0.5);

  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - margem;

  const novaPagina = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - margem;
  };
  const garantirEspaco = (altura: number) => {
    if (y - altura < margem + 40) novaPagina();
  };
  const centralizado = (
    texto: string,
    size: number,
    font: PDFFont,
    cor = preto,
  ) => {
    const t = sanitizar(texto);
    const w = font.widthOfTextAtSize(t, size);
    page.drawText(t, { x: (A4.w - w) / 2, y, size, font, color: cor });
    y -= size + 6;
  };
  const paragrafo = (
    texto: string,
    size = 11,
    font: PDFFont = regular,
    espacoDepois = 8,
  ) => {
    for (const linha of quebrarLinhas(texto, font, size, larguraUtil)) {
      garantirEspaco(size + 4);
      if (linha) {
        page.drawText(linha, { x: margem, y, size, font, color: preto });
      }
      y -= size + 4;
    }
    y -= espacoDepois;
  };

  // Cabecalho: instituicao, subtitulos institucionais fixos e, por ultimo, o CPM.
  centralizado(spec.cabecalhoInstituicao.toUpperCase(), 13, bold);
  for (const subtitulo of spec.cabecalhoSubtitulos ?? []) {
    centralizado(subtitulo, 9.5, regular, cinza);
  }
  centralizado(spec.cabecalhoUnidade, 11, regular, cinza);
  y -= 4;
  page.drawLine({
    start: { x: margem, y },
    end: { x: A4.w - margem, y },
    thickness: 1,
    color: cinza,
  });
  y -= 22;

  centralizado(spec.titulo.toUpperCase(), 13, bold);
  if (spec.numero) {
    centralizado(spec.numero, 10, regular, cinza);
  }
  y -= 12;

  for (const campo of spec.campos) {
    garantirEspaco(16);
    const rotulo = `${sanitizar(campo.rotulo)}: `;
    page.drawText(rotulo, { x: margem, y, size: 10, font: bold, color: preto });
    const offset = bold.widthOfTextAtSize(rotulo, 10);
    const valorLinhas = quebrarLinhas(
      campo.valor,
      regular,
      10,
      larguraUtil - offset,
    );
    valorLinhas.forEach((linha, i) => {
      if (i > 0) {
        y -= 14;
        garantirEspaco(14);
      }
      page.drawText(linha, {
        x: margem + offset,
        y,
        size: 10,
        font: regular,
        color: preto,
      });
    });
    y -= 16;
  }
  if (spec.campos.length > 0) y -= 8;

  for (const p of spec.paragrafos) {
    paragrafo(p);
  }

  y -= 24;
  for (const ass of spec.assinaturas) {
    garantirEspaco(56);
    y -= 24;
    const linhaW = 240;
    page.drawLine({
      start: { x: (A4.w - linhaW) / 2, y },
      end: { x: (A4.w + linhaW) / 2, y },
      thickness: 0.8,
      color: preto,
    });
    y -= 14;
    centralizado(ass.nome, 10, bold);
    if (ass.cargo) centralizado(ass.cargo, 9, regular, cinza);
    y -= 10;
  }

  const rodape = sanitizar(
    spec.rodape ??
      `Documento gerado eletronicamente pelo Sistema Disciplinar CPM em ${new Date().toLocaleString(
        "pt-BR",
      )}.`,
  );
  page.drawText(rodape, {
    x: margem,
    y: margem - 12,
    size: 7.5,
    font: regular,
    color: cinza,
  });

  return doc.save();
}
