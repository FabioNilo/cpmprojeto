// Gerador do documento institucional "Sistema Disciplinar CPM — Proposta de
// Implantação". Script avulso (fora do app), roda uma vez com:
//   node scripts/gerar-doc-projeto.cjs
// Gera docs/Projeto-Sistema-Disciplinar-CPM-RG.pdf

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 58;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COR_TITULO = rgb(0.09, 0.13, 0.24);
const COR_TEXTO = rgb(0.16, 0.16, 0.18);
const COR_REGRA = rgb(0.72, 0.74, 0.79);
const COR_ACENTO = rgb(0.55, 0.09, 0.11); // grená / bordô institucional
const COR_MUTED = rgb(0.45, 0.46, 0.5);

// ---------------------------------------------------------------------------
// Conteúdo
// ---------------------------------------------------------------------------

const INSTITUICAO = "Colégio da Polícia Militar Rômulo Galvão";
const PROPONENTE = "Cap. PM Fábio";
const DESTINATARIO = "Ao Diretor do Colégio da Polícia Militar Rômulo Galvão";

const SECOES = [
  {
    titulo: "Sumário Executivo",
    blocos: [
      { p: "O Sistema Disciplinar CPM é um ambiente digital único, seguro e auditável para a gestão de todo o processo disciplinar do Colégio da Polícia Militar Rômulo Galvão — da comunicação inicial de uma ocorrência até a ficha de acompanhamento do aluno, passando por manifestação, ciência, enquadramento regimental, decisão, sanção, reconsideração e, quando necessário, afastamento cautelar, sindicância e conselho disciplinar." },
      { p: "O sistema já foi construído em sua totalidade e está em funcionamento como piloto, operando com dados reais do próprio Colégio: 1.218 alunos e 2.772 ocorrências disciplinares já migradas para o novo ambiente. O que falta é a decisão do Comando para publicá-lo como ferramenta oficial de uso corrente." },
      { p: "Este documento apresenta a justificativa do projeto, seu escopo, a governança proposta sobre os dados, o que já foi entregue, o cronograma até a publicação definitiva, os benefícios esperados, os riscos identificados e o investimento estimado de manutenção." },
    ],
  },
  {
    titulo: "1. Justificativa",
    blocos: [
      { p: "O processo disciplinar regimental — regido pelo conjunto de normas do Colégio (pontuação inicial de comportamento, faixas de EXCEPCIONAL a INCOMPATÍVEL, naturezas de transgressão LEVE, MÉDIA, GRAVE e ELIMINATÓRIA, prazos processuais e competências por posto/função) — hoje depende fortemente de registro manual e tramitação em papel." },
      { p: "Esse modelo traz riscos conhecidos: perda ou extravio de processos, dificuldade de controlar prazos regimentais (como os 15 dias para reconsideração), ausência de um histórico único e consultável do comportamento de cada aluno, e pouca transparência para os responsáveis, que só tomam conhecimento formal do processo quando convocados presencialmente." },
      { p: "Há ainda um risco de conformidade: registros em papel, arquivados fisicamente, são mais difíceis de proteger e de auditar do ponto de vista da Lei Geral de Proteção de Dados (LGPD), que se aplica a dados de alunos menores de idade com o mesmo rigor de qualquer outro dado pessoal sensível." },
      { p: "A digitalização completa do fluxo disciplinar resolve essas três frentes ao mesmo tempo: elimina o risco físico de perda de processo, aplica os prazos e competências regimentais automaticamente, e cria uma trilha de auditoria permanente de quem fez o quê e quando." },
    ],
  },
  {
    titulo: "2. Objetivos",
    blocos: [
      { p: "Objetivo geral: prover ao Colégio da Polícia Militar Rômulo Galvão um ambiente digital único, seguro e auditável para a gestão do processo disciplinar, do registro da ocorrência até a ficha disciplinar consolidada do aluno." },
      { subtitulo: "Objetivos específicos:" },
      { bullets: [
        "Digitalizar o fluxo disciplinar completo, do registro da ocorrência à decisão final e eventual reconsideração.",
        "Aplicar automaticamente os prazos e as competências regimentais previstas para cada natureza de transgressão.",
        "Dar transparência ao responsável, que acompanha o processo do próprio filho a qualquer momento, pelo celular.",
        "Manter trilha de auditoria permanente de todas as ações realizadas no sistema.",
        "Centralizar a pontuação de comportamento de cada aluno em um extrato único e sempre atualizado.",
        "Gerar automaticamente os documentos oficiais do processo (comunicações, termos de ciência, decisões, portarias).",
      ] },
    ],
  },
  {
    titulo: "3. Escopo do Sistema",
    blocos: [
      { p: "O sistema cobre o processo disciplinar do início ao fim, em módulos integrados:" },
      { bullets: [
        "Comunicação de ocorrência disciplinar — registro do fato, podendo envolver um ou vários alunos, cada um com processo próprio e numeração oficial individual.",
        "Manifestação e ciência — o aluno e/ou o responsável se manifestam sobre o fato e confirmam ciência formal, tudo registrado com data e hora.",
        "Enquadramento regimental e decisão — a autoridade competente enquadra a transgressão e registra a decisão, respeitando a competência prevista para cada natureza (Chefe do Corpo de Alunos, Diretor-Adjunto ou Diretor, conforme o caso).",
        "Sanções e pontuação — aplicação da sanção prevista e cálculo automático do impacto na pontuação de comportamento do aluno, com histórico completo e imutável de cada movimento.",
        "Elogios e restauração — registro de elogios e restauração gradual de pontuação conforme previsto no regimento.",
        "Reconsideração — pedido do responsável, com prazo regimental de 15 dias controlado automaticamente pelo sistema.",
        "Afastamento cautelar, sindicância e conselho disciplinar — para os casos que exigem apuração mais aprofundada.",
        "Ficha de Acompanhamento Disciplinar (FAD) e painel — visão consolidada do histórico de cada aluno e indicadores gerais para a gestão do Colégio.",
        "Anexos digitais — documentos e provas anexados a cada processo, armazenados de forma segura e com controle de acesso.",
        "Geração automática de documentos oficiais em PDF — comunicações, termos de ciência, decisões, despachos e a própria ficha do aluno, prontos para impressão ou assinatura.",
        "Portal do responsável — ambiente próprio, simplificado, para que pais e responsáveis acompanhem os processos dos próprios filhos e cumpram as etapas que lhes cabem (manifestação, ciência, pedido de reconsideração).",
      ] },
    ],
  },
  {
    titulo: "4. Público-Alvo e Perfis de Acesso",
    blocos: [
      { p: "O acesso ao sistema é segmentado por perfil, cada um enxergando apenas o que precisa para sua função:" },
      { bullets: [
        "Comando e direção — Diretor, Diretor-Adjunto e Chefe do Corpo de Alunos, com visão completa do Colégio e competência de decisão conforme o regimento.",
        "Corpo de alunos / instrutores — responsáveis pelo registro das ocorrências do dia a dia.",
        "Professores — comunicação de ocorrências observadas em sala de aula.",
        "Responsáveis (pais) — acompanhamento exclusivo dos processos dos próprios filhos, pelo Portal do Responsável.",
      ] },
      { p: "Cada perfil só acessa exatamente as informações e ações permitidas pela sua função — um responsável, por exemplo, nunca visualiza dados de outro aluno que não seja seu dependente." },
    ],
  },
  {
    titulo: "5. Governança, Propriedade e Proteção de Dados",
    blocos: [
      { p: "O Colégio da Polícia Militar Rômulo Galvão é o proprietário do sistema e de todos os dados nele registrados, incluindo o histórico disciplinar dos alunos, os documentos gerados e os registros de auditoria. Recomenda-se formalizar essa titularidade em termo interno, definindo o Colégio como controlador dos dados pessoais tratados." },
      { p: "Toda ação relevante no sistema — registro de ocorrência, manifestação, decisão, aplicação de sanção, alteração de pontuação — fica registrada de forma permanente em uma trilha de auditoria, identificando quem realizou a ação e quando." },
      { p: "O acesso é controlado por perfil (cada usuário só vê e faz o que sua função permite), as senhas nunca são armazenadas em texto legível, e as sessões de acesso são controladas e podem ser revogadas a qualquer momento." },
      { p: "O tratamento de dados de alunos e responsáveis segue os princípios da LGPD: finalidade específica (gestão disciplinar), acesso restrito por necessidade, e nenhum compartilhamento externo dos dados." },
    ],
  },
  {
    titulo: "6. O Que Já Está Entregue",
    blocos: [
      { p: "O sistema não é uma proposta em papel: já foi construído por completo e está em funcionamento como piloto, com dados reais do Colégio." },
      { bullets: [
        "Todos os módulos do processo disciplinar (item 3) estão implementados e testados: comunicação, manifestação, ciência, enquadramento, decisão, sanções, pontuação, elogios, reconsideração, afastamento cautelar, sindicância, conselho, ficha disciplinar e anexos.",
        "1.218 alunos e 2.772 ocorrências disciplinares do Colégio já foram migrados para o novo ambiente, servindo de prova real de que o sistema opera corretamente em escala.",
        "O Portal do Responsável já está funcional, com login próprio, senha provisória gerada pelo sistema e termo de responsabilidade no primeiro acesso.",
        "A geração automática de documentos oficiais em PDF (comunicações, termos de ciência, decisões, despachos, portarias, ficha disciplinar) já está operante.",
        "O controle de acesso por perfil e a trilha de auditoria completa já estão em funcionamento.",
      ] },
      { p: "O que resta para a publicação definitiva é essencialmente administrativo: a aprovação formal do Comando para uso oficial e o ajuste dos textos das minutas de documentos conforme o Regimento vigente." },
    ],
  },
  {
    titulo: "7. Cronograma",
    blocos: [
      { bullets: [
        "Fase 1 — Concluída: construção completa do sistema e piloto com dados reais do Colégio.",
        "Fase 2 — Próxima: aprovação do Comando, publicação em ambiente de produção definitivo e capacitação dos usuários (corpo de alunos, professores e equipe de direção).",
        "Fase 3: acompanhamento pós-lançamento, com ajuste dos textos oficiais dos documentos gerados conforme o Regimento Disciplinar vigente.",
        "Fase 4 — Visão futura: avaliação, pelo Comando Geral da Polícia Militar da Bahia, da extensão do sistema como solução compartilhada para os demais Colégios da Polícia Militar do Estado.",
      ] },
    ],
  },
  {
    titulo: "8. Benefícios Esperados",
    blocos: [
      { bullets: [
        "Agilidade no trâmite de cada processo disciplinar, com prazos e competências aplicados automaticamente.",
        "Transparência para os responsáveis, que acompanham o processo do próprio filho a qualquer momento, do celular.",
        "Redução de retrabalho e de erros de preenchimento, com documentos oficiais gerados automaticamente.",
        "Padronização do cumprimento do regimento disciplinar, com a mesma régua aplicada a todos os alunos.",
        "Histórico disciplinar permanente e auditável de cada aluno, consultável a qualquer momento pela gestão.",
        "Continuidade institucional: o histórico do aluno não depende mais de arquivo físico, e sim de um sistema com backup e controle de acesso.",
      ] },
    ],
  },
  {
    titulo: "9. Riscos e Mitigação",
    blocos: [
      { bullets: [
        "Dependência de conexão à internet — mitigação: interface leve, compatível com acesso móvel, e hospedagem em provedor com alta disponibilidade.",
        "Resistência inicial à mudança de processo — mitigação: capacitação da equipe antes da publicação oficial e período de acompanhamento próximo na Fase 3.",
        "Textos de documentos ainda em formato de minuta — mitigação: revisão pela direção do Colégio antes do uso oficial, ajustando a redação ao Regimento vigente.",
        "Continuidade e manutenção técnica do sistema ao longo do tempo — mitigação: definição formal de um responsável técnico (interno ou por contrato) para suporte e evolução do sistema.",
      ] },
    ],
  },
  {
    titulo: "10. Investimento",
    blocos: [
      { subtitulo: "Operação e hospedagem" },
      { p: "O custo de manter o sistema em funcionamento — banco de dados seguro e servidor de aplicação em nuvem — é estimado em R$ 1.100,00 (mil e cem reais) por ano." },
      { subtitulo: "Desenvolvimento" },
      { p: "Não há, até o momento, um valor fechado para o desenvolvimento já realizado. Como referência de mercado, o desenvolvimento de um sistema com este nível de complexidade — múltiplos perfis de acesso, trilha de auditoria completa, geração automática de documentos, cálculo de regras regimentais e portal externo para responsáveis — é tipicamente orçado, no mercado brasileiro, na faixa de R$ 150,00 a R$ 250,00 por hora de desenvolvimento especializado." },
      { p: "O sistema aqui apresentado já foi construído integralmente nessas condições, com apoio de engenharia assistida por inteligência artificial, o que reduziu significativamente o tempo efetivo de desenvolvimento em relação a uma estimativa tradicional de mercado para um projeto deste porte." },
    ],
  },
  {
    titulo: "11. Próximos Passos",
    blocos: [
      { bullets: [
        "Aprovação do Diretor do Colégio para o uso oficial do sistema.",
        "Definição do nome de publicação (domínio) do sistema em produção.",
        "Capacitação da equipe do Corpo de Alunos, dos professores e da direção para uso do sistema.",
        "Revisão e ajuste dos textos das minutas de documentos conforme o Regimento Disciplinar vigente.",
        "Formalização, em termo interno, da titularidade do Colégio sobre o sistema e sobre os dados nele tratados.",
      ] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Motor de layout
// ---------------------------------------------------------------------------

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function main() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Sistema Disciplinar CPM — Proposta de Implantação");
  pdf.setAuthor(PROPONENTE);
  pdf.setSubject(INSTITUICAO);
  pdf.setProducer("cpm-disciplinar");

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = null;
  let y = 0;
  const contentPages = [];

  function newPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    contentPages.push(page);
    return page;
  }

  function ensureSpace(needed) {
    if (y - needed < MARGIN + 26) newPage();
  }

  function heading(text) {
    ensureSpace(30);
    y -= 4;
    page.drawText(text, { x: MARGIN, y, size: 13.5, font: fontBold, color: COR_TITULO });
    y -= 17;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_W, y },
      thickness: 0.75,
      color: COR_REGRA,
    });
    y -= 14;
  }

  function subtitulo(text) {
    ensureSpace(20);
    page.drawText(text, { x: MARGIN, y, size: 11, font: fontBold, color: COR_TITULO });
    y -= 18;
  }

  function paragraph(text) {
    const size = 10.5;
    const lineHeight = size * 1.5;
    const lines = wrapText(text, fontRegular, size, CONTENT_W);
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: MARGIN, y, size, font: fontRegular, color: COR_TEXTO });
      y -= lineHeight;
    }
    y -= 7;
  }

  function bullets(items) {
    const size = 10.5;
    const lineHeight = size * 1.5;
    const indent = 15;
    for (const item of items) {
      const lines = wrapText(item, fontRegular, size, CONTENT_W - indent);
      lines.forEach((line, i) => {
        ensureSpace(lineHeight);
        if (i === 0) {
          page.drawText("•", { x: MARGIN, y, size, font: fontBold, color: COR_ACENTO });
        }
        page.drawText(line, { x: MARGIN + indent, y, size, font: fontRegular, color: COR_TEXTO });
        y -= lineHeight;
      });
    }
    y -= 7;
  }

  // ---- Capa -----------------------------------------------------------
  const cover = pdf.addPage([PAGE_W, PAGE_H]);
  {
    let cy = PAGE_H - 90;
    const centerText = (text, size, font, color) => {
      const w = font.widthOfTextAtSize(text, size);
      cover.drawText(text, { x: (PAGE_W - w) / 2, y: cy, size, font, color });
    };
    centerText("POLÍCIA MILITAR DA BAHIA", 11, fontBold, COR_MUTED);
    cy -= 18;
    centerText(INSTITUICAO.toUpperCase(), 12, fontBold, COR_TITULO);
    cy -= 70;

    // Espaço reservado para o brasão
    const boxSize = 96;
    const boxX = (PAGE_W - boxSize) / 2;
    cover.drawRectangle({
      x: boxX,
      y: cy - boxSize,
      width: boxSize,
      height: boxSize,
      borderColor: COR_REGRA,
      borderWidth: 1,
      borderDashArray: [4, 3],
    });
    const placeholder = "espaço reservado para o brasão";
    const phSize = 8;
    const phW = fontItalic.widthOfTextAtSize(placeholder, phSize);
    cover.drawText(placeholder, {
      x: (PAGE_W - phW) / 2,
      y: cy - boxSize / 2 - 4,
      size: phSize,
      font: fontItalic,
      color: COR_MUTED,
    });
    cy -= boxSize + 70;

    centerText("SISTEMA DISCIPLINAR CPM", 26, fontBold, COR_TITULO);
    cy -= 30;
    centerText("Proposta de Implantação do Ambiente Virtual", 13, fontRegular, COR_TEXTO);
    cy -= 18;
    centerText("de Controle Disciplinar", 13, fontRegular, COR_TEXTO);
    cy -= 60;

    cover.drawLine({
      start: { x: PAGE_W / 2 - 90, y: cy },
      end: { x: PAGE_W / 2 + 90, y: cy },
      thickness: 1,
      color: COR_ACENTO,
    });
    cy -= 40;

    centerText(`Proponente: ${PROPONENTE}`, 11, fontRegular, COR_TEXTO);
    cy -= 18;
    centerText(DESTINATARIO, 11, fontRegular, COR_TEXTO);
    cy -= 40;
    centerText("Data de apresentação: ____ / ____ / 2026", 10, fontItalic, COR_MUTED);
  }

  // ---- Sumário -----------------------------------------------------------
  newPage();
  page.drawText("Sumário", { x: MARGIN, y, size: 16, font: fontBold, color: COR_TITULO });
  y -= 26;
  for (const secao of SECOES) {
    ensureSpace(16);
    page.drawText(secao.titulo, { x: MARGIN, y, size: 10.5, font: fontRegular, color: COR_TEXTO });
    y -= 17;
  }

  // ---- Seções --------------------------------------------------------
  const QUEBRA_ANTES = new Set([
    "3. Escopo do Sistema",
    "5. Governança, Propriedade e Proteção de Dados",
    "6. O Que Já Está Entregue",
    "8. Benefícios Esperados",
    "9. Riscos e Mitigação",
    "10. Investimento",
    "11. Próximos Passos",
  ]);
  for (const secao of SECOES) {
    if (QUEBRA_ANTES.has(secao.titulo)) newPage();
    else ensureSpace(190);
    heading(secao.titulo);
    for (const bloco of secao.blocos) {
      if (bloco.p) paragraph(bloco.p);
      else if (bloco.subtitulo) subtitulo(bloco.subtitulo);
      else if (bloco.bullets) bullets(bloco.bullets);
    }
  }

  // ---- Cabeçalho + rodapé em todas as páginas de conteúdo -----------
  const total = contentPages.length;
  contentPages.forEach((p, idx) => {
    p.drawText(INSTITUICAO, { x: MARGIN, y: PAGE_H - 34, size: 8, font: fontRegular, color: COR_MUTED });
    p.drawLine({
      start: { x: MARGIN, y: PAGE_H - 40 },
      end: { x: PAGE_W - MARGIN, y: PAGE_H - 40 },
      thickness: 0.5,
      color: COR_REGRA,
    });
    const rodape = `Sistema Disciplinar CPM — Página ${idx + 1} de ${total}`;
    const w = fontRegular.widthOfTextAtSize(rodape, 8);
    p.drawText(rodape, { x: PAGE_W - MARGIN - w, y: MARGIN - 24, size: 8, font: fontRegular, color: COR_MUTED });
  });

  const bytes = await pdf.save();
  const outDir = path.join(__dirname, "..", "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "Projeto-Sistema-Disciplinar-CPM-RG.pdf");
  fs.writeFileSync(outPath, bytes);
  console.log("PDF gerado em:", outPath);
  console.log("Páginas:", pdf.getPageCount());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
