// Manual do usuário final do Sistema Disciplinar CPM, organizado por grupo
// de perfil de acesso (Comando / Professor-Militar-Funcionário / Responsável).
// Não inclui o perfil Administrador, a pedido do usuário.
// Script avulso (fora do app), roda uma vez com:
//   node scripts/gerar-manual-usuario.cjs
// Gera docs/Manual-do-Usuario-Sistema-Disciplinar-CPM.pdf
//
// As imagens de tela ficam no scratchpad da sessão (não versionadas) - o
// script só precisa delas existirem no momento de gerar o PDF; os bytes já
// ficam embutidos no arquivo final.

const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const IMG_DIR =
  "C:/Users/cippa/AppData/Local/Temp/claude/c--dev-cpm-disciplinar/885c00b1-5c98-4751-ba6c-bbd438f838da/scratchpad/screenshots";

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - MARGIN * 2;

const NAVY = rgb(0.09, 0.13, 0.24);
const TEXTO = rgb(0.16, 0.16, 0.18);
const MUTED = rgb(0.44, 0.46, 0.5);
const REGRA = rgb(0.75, 0.77, 0.82);
const ACENTO = rgb(0.55, 0.09, 0.11);

const INSTITUICAO = "Polícia Militar da Bahia";
const UNIDADE = "Colégio da Polícia Militar - Rômulo Galvão";

// ---------------------------------------------------------------------------
// Conteudo
// ---------------------------------------------------------------------------

const GRUPOS_INTRO = [
  {
    grupo: "Grupo Comando",
    perfis: [
      "Diretor PM",
      "Diretor-Adjunto",
      "Chefe do Corpo de Alunos",
      "Comandante de Companhia",
      "Comandante de Pelotão",
    ],
    nota: "Nem todos veem exatamente as mesmas telas. Diretor PM, Diretor-Adjunto e Chefe do Corpo de Alunos têm o menu completo mostrado nesta seção. Comandante de Companhia e Comandante de Pelotão têm um menu mais enxuto: não veem Usuários, Responsáveis, Matrículas, Anos letivos nem Catálogos disciplinares - o restante (Painel, Nova comunicação, Ocorrências, Comportamento, Reconsiderações) é igual.",
  },
  {
    grupo: "Grupo Professor / Militar / Funcionário",
    perfis: ["Professor", "Militar", "Funcionário"],
    nota: "Os três perfis registram comunicações e veem as próprias. Só o Professor tem, além disso, acesso de leitura ao Catálogo disciplinar e ao Comportamento dos alunos.",
  },
  {
    grupo: "Grupo Responsável",
    perfis: ["Responsável (pai, mãe ou responsável legal)"],
    nota: "Portal próprio, mais simples, pensado para uso pelo celular. O responsável só acessa os processos dos próprios filhos.",
  },
];

const SECOES = [
  {
    titulo: "Acesso ao sistema",
    screenshot: "00-login.png",
    blocos: [
      { p: "Todo mundo entra pela mesma tela, em qualquer computador ou celular com internet." },
      {
        passos: [
          'Digite seu CPF ou nome de usuário no campo "CPF ou usuário".',
          'Digite sua senha no campo "Senha" (o botão "Mostrar" revela o que foi digitado, para conferir).',
          'Marque "Lembrar-me" se estiver usando um computador de uso pessoal, para não precisar digitar login toda vez.',
          'Clique em "Entrar".',
        ],
      },
      { subtitulo: "Esqueci minha senha" },
      { p: 'Clique em "Esqueci minha senha" e siga as instruções na tela. Para responsáveis, o pedido de nova senha é atendido por alguém do Corpo de Alunos ou da Direção (ver seção Responsáveis, no Grupo Comando) - não chega e-mail automático.' },
    ],
  },
];

const SECOES_COMANDO = [
  {
    titulo: "Painel (início)",
    screenshot: "10-comando-dashboard.png",
    blocos: [
      { p: "É a primeira tela depois do login. Reúne atalhos para as ações mais usadas no dia a dia, cada uma com uma contagem quando há algo pendente (por exemplo, quantos processos estão aguardando manifestação)." },
      { subtitulo: "O que cada card leva" },
      {
        bullets: [
          "Nova comunicação - registrar um fato disciplinar.",
          "Ocorrências - todas as comunicações e o andamento de cada processo.",
          "Reconsiderações - pedidos aguardando decisão.",
          "Painel disciplinar - indicadores do colégio (faixas, sanções, reincidência).",
          "Comportamento - saldo e faixa de comportamento por aluno.",
          "Responsáveis - cadastro de responsáveis e pedidos de nova senha.",
          "Alunos - consulta por turma, sala ou nome.",
          "Catálogos disciplinares - transgressões, sanções, faixas e prazos cadastrados.",
        ],
      },
      { p: "O menu no topo da página (Painel, Usuários, Alunos, Responsáveis, Turmas, Anos letivos, Matrículas, Ocorrências, Painel disciplinar, Reconsiderações, Comportamento, Catálogos disciplinares, Minha conta) fica sempre visível e é o mesmo em qualquer tela do sistema." },
    ],
  },
  {
    titulo: "Nova comunicação",
    screenshot: "11-comando-nova-comunicacao.png",
    blocos: [
      { p: "Tela para registrar um fato disciplinar. O enquadramento (qual artigo foi violado) e a eventual sanção NÃO são definidos aqui - isso acontece depois, numa etapa separada, pela autoridade competente." },
      { subtitulo: "Campos do formulário" },
      {
        bullets: [
          "Tipo - normalmente \"Disciplinar\".",
          "Data e hora do fato - quando o fato aconteceu (não precisa ser agora).",
          "Local - onde aconteceu (opcional).",
          "Disciplinar (componente curricular) - a matéria da aula em que aconteceu, se for o caso (opcional).",
          "Descrição do fato - o relato em si. Aqui é só o fato observado, sem opinião sobre culpa ou sanção.",
          "Alunos envolvidos - filtre por Turma e Sala (ou busque por nome/matrícula) e clique em \"Buscar alunos\" para marcar quem esteve envolvido.",
          "Ocorrência sigilosa - marque se o teor exigir sigilo maior.",
        ],
      },
      { subtitulo: "Importante sobre comunicação coletiva" },
      { p: "Se você marcar vários alunos de uma vez (por exemplo, uma turma inteira que se comportou mal na mesma aula), o sistema cria UM processo individual e próprio para cada aluno, com número oficial próprio - a defesa e a decisão de cada um correm de forma independente, mesmo tendo nascido do mesmo registro." },
      {
        passos: [
          "Preencha os campos do fato.",
          "Filtre e selecione o(s) aluno(s) envolvido(s).",
          'Clique em "Registrar comunicação".',
          "A comunicação nasce como rascunho - revise e envie a partir da tela de detalhe (próxima seção) para que o número oficial seja gerado.",
        ],
      },
    ],
  },
  {
    titulo: "Ocorrências (lista)",
    screenshot: "12-comando-ocorrencias-lista.png",
    blocos: [
      { p: "Lista todas as comunicações registradas no colégio, com status e número. Clique em qualquer linha para abrir o detalhe do processo (próxima seção)." },
    ],
  },
  {
    titulo: "Detalhe da ocorrência",
    screenshot: "13-comando-ocorrencia-detalhe.png",
    blocos: [
      { p: "Aqui acontece o acompanhamento completo de um processo: dados do fato, manifestação do aluno/responsável, confirmação de ciência, enquadramento, decisão, sanção, reconsideração, afastamento cautelar, sindicância, conselho disciplinar e anexos - tudo dentro da mesma tela, organizado em blocos." },
      { subtitulo: "Fluxo típico de um processo" },
      {
        passos: [
          'Enviar - transforma o rascunho em comunicação oficial numerada (botão no topo, só aparece em rascunho).',
          "Aguardar manifestação e ciência - o aluno/responsável se manifesta e confirma ciência (pelo Portal do Responsável) ou você pode registrar isso por eles, se necessário.",
          'Enquadrar - abra "Enquadramento" e escolha a transgressão correspondente do catálogo.',
          'Decidir - abra o bloco de decisão: escolha o resultado (procedente, improcedente, arquivado ou encaminhado para sindicância) e, se houver sanção, o tipo dela.',
          "Aplicar a sanção - depois da decisão procedente com sanção, aplique a sanção no bloco correspondente; isso é o que efetivamente desconta pontos do comportamento do aluno.",
          "Se necessário: instaure sindicância, determine afastamento cautelar ou instaure conselho disciplinar, nos blocos mais abaixo.",
          'Arquivar - a qualquer momento (menos com decisão já tomada), o bloco "Ações" no final permite arquivar a comunicação com um motivo.',
        ],
      },
      { subtitulo: "Documentos em PDF" },
      { p: 'Cada etapa concluída (comunicação, termo de ciência, decisão, despacho de reconsideração...) tem um botão para gerar o documento oficial em PDF, pronto para impressão ou assinatura.' },
    ],
  },
  {
    titulo: "Comportamento (lista de alunos)",
    screenshot: "14-comando-comportamento-lista.png",
    blocos: [
      { p: "Mostra o saldo de comportamento e a faixa (Excepcional, Ótimo, Bom, Regular, Insuficiente, Incompatível) de cada aluno. Use os filtros de turma, sala ou nome para localizar um aluno específico. Clique no nome para abrir o extrato completo dele." },
    ],
  },
  {
    titulo: "Extrato do aluno e Ficha Disciplinar (FAD)",
    screenshot: "15-comando-comportamento-extrato.png",
    blocos: [
      { p: "Extrato completo do comportamento de um aluno: saldo atual, faixa, indicação de acompanhamento (quando o saldo está abaixo de 6,00) e o histórico de cada movimento de pontuação (sanções e elogios), do mais antigo ao mais recente." },
      { subtitulo: "Ações disponíveis" },
      {
        bullets: [
          '"Registrar elogio" - concede um elogio ao aluno, com efeito positivo no saldo.',
          '"Ajuste administrativo de pontos" - correção manual excepcional, com justificativa.',
          '"Gerar nova versão da FAD" - monta um retrato atual e completo do histórico disciplinar do aluno, versionado e identificado por um código (hash) de conferência.',
          '"Baixar FAD (PDF)" - baixa a versão mais recente já gerada, pronta para impressão.',
        ],
      },
    ],
  },
  {
    titulo: "Reconsiderações",
    screenshot: "16-comando-reconsideracoes.png",
    blocos: [
      { p: "Fila de pedidos de reconsideração aguardando decisão da autoridade competente. O prazo regimental para o responsável pedir reconsideração é de 15 dias corridos a partir da ciência da decisão; enquanto o pedido está pendente, os efeitos da sanção ficam suspensos." },
    ],
  },
  {
    titulo: "Painel disciplinar",
    screenshot: "17-comando-painel.png",
    blocos: [
      { p: "Indicadores gerais do colégio: distribuição de alunos por faixa de comportamento, sanções aplicadas e alunos reincidentes. Útil para uma visão geral, sem precisar abrir aluno por aluno." },
    ],
  },
  {
    titulo: "Usuários",
    screenshot: "18-comando-usuarios.png",
    blocos: [
      { p: "Cadastro de usuários internos (equipe do colégio) vinculados ao colégio ativo." },
      {
        bullets: [
          "Nome e Posto/graduação - aparecem juntos nos documentos oficiais gerados pelo sistema.",
          "Usuário, Email, CPF - qualquer um pode ser usado depois para fazer login.",
          "Senha inicial - a pessoa pode trocar depois, em \"Minha conta\".",
          "Perfil no colégio ativo - define o que a pessoa vai poder ver e fazer.",
        ],
      },
      { p: 'Na lista abaixo do formulário é possível inativar um usuário ou editar seus dados.' },
    ],
  },
  {
    titulo: "Responsáveis",
    screenshot: "19-comando-responsaveis.png",
    blocos: [
      { p: "Cadastro dos responsáveis (pais/responsáveis legais) e vínculo deles com os alunos." },
      {
        bullets: [
          "Ao cadastrar um responsável, o sistema gera uma senha provisória automaticamente (não é preciso digitar uma) - ela aparece uma única vez na tela, para ser repassada ao responsável.",
          "No primeiro acesso, o responsável é obrigado a trocar essa senha e aceitar o Termo de Responsabilidade.",
          '"Nova senha provisória" - gera outra senha caso o responsável a perca.',
          '"Solicitações de nova senha" - fila de pedidos feitos pelo próprio responsável (que não tem e-mail cadastrado para recuperação automática); atenda gerando uma nova senha e repassando por telefone.',
        ],
      },
    ],
  },
  {
    titulo: "Matrículas",
    screenshot: "20-comando-matriculas.png",
    blocos: [
      { p: "Vincula um aluno a uma turma dentro de um ano letivo - é essa matrícula que serve de base para a pontuação disciplinar. Filtre por turma/sala ou nome, escolha a turma de destino e clique em \"Matricular\"." },
    ],
  },
  {
    titulo: "Turmas e Anos letivos",
    screenshot: "21-comando-turmas.png",
    blocos: [
      { p: 'Cadastro das turmas do colégio (nome, turno, ano letivo). O menu "Anos letivos" (ao lado, no topo) cadastra os períodos letivos aos quais as turmas pertencem - normalmente configurado uma vez por ano, no início do período letivo.' },
    ],
  },
  {
    titulo: "Catálogos disciplinares",
    screenshot: "22-comando-catalogos.png",
    blocos: [
      { p: "Tabelas de referência usadas em todo o sistema: transgressões (com natureza leve, média, grave ou eliminatória), tipos de sanção e seu impacto na pontuação, faixas de comportamento, prazos processuais, atenuantes e agravantes. Normalmente conferido/ajustado quando o Regimento Escolar for atualizado." },
    ],
  },
];

const SECOES_PROFESSOR = [
  {
    titulo: "Painel (início)",
    screenshot: "30-professor-dashboard.png",
    blocos: [
      { p: "Tela inicial mais enxuta, com o atalho para registrar uma nova comunicação e o acesso às comunicações já feitas." },
    ],
  },
  {
    titulo: "Nova comunicação",
    screenshot: "31-professor-nova-comunicacao.png",
    blocos: [
      { p: "Mesmo formulário descrito no Grupo Comando (página anterior deste manual): tipo, data/hora, local, disciplinar, descrição do fato e seleção de aluno(s). A diferença é que, depois de enviada, a comunicação passa a ser conduzida pelo Corpo de Alunos ou pela Direção - quem registra a comunicação normalmente não decide o processo." },
    ],
  },
  {
    titulo: "Minhas comunicações",
    screenshot: "32-professor-ocorrencias-lista.png",
    blocos: [
      { p: "Lista apenas as comunicações que a própria pessoa registrou, com o status atual de cada uma (aguardando, em análise, decidida...)." },
    ],
  },
  {
    titulo: "Comportamento (somente Professor)",
    screenshot: "33-professor-comportamento.png",
    blocos: [
      { p: "Consulta o saldo e a faixa de comportamento dos alunos, para acompanhamento pedagógico. Somente leitura - só o Grupo Comando pode registrar elogios ou ajustar pontuação. Militar e Funcionário não têm acesso a esta tela." },
    ],
  },
];

const SECOES_RESPONSAVEL = [
  {
    titulo: "Primeiro acesso",
    blocos: [
      { p: "Quando um responsável é cadastrado pela primeira vez, o sistema gera uma senha provisória (repassada pelo colégio, normalmente por telefone). No primeiro login com essa senha, a tela pede duas coisas antes de liberar o acesso normal:" },
      {
        passos: [
          "Ler e aceitar o Termo de Responsabilidade (uso do sistema e tratamento de dados, conforme a LGPD).",
          "Cadastrar uma senha nova, definitiva (digitada duas vezes, para confirmar).",
        ],
      },
      { p: "Depois disso, o acesso passa a ser normal, direto para \"Meus filhos\"." },
    ],
  },
  {
    titulo: "Meus filhos",
    screenshot: "40-responsavel-meus-filhos.png",
    blocos: [
      { p: "Tela inicial do portal: lista cada filho vinculado ao responsável e, para cada um, os processos disciplinares em aberto. Quando há algo pendente do lado do responsável, aparece um aviso em destaque (por exemplo, \"Pode apresentar manifestação - Confirmar ciência\"). Clique no processo para abrir o detalhe." },
    ],
  },
  {
    titulo: "Detalhe do processo do filho",
    screenshot: "41-responsavel-processo-detalhe.png",
    blocos: [
      { p: "Mostra os dados do fato (situação, tipo, data, local e relato) e as ações que o responsável pode tomar." },
      { subtitulo: "Apresentar manifestação / justificativa" },
      { p: 'Clique em "Apresentar manifestação / justificativa" para abrir o campo de texto e explicar o que aconteceu, do ponto de vista do aluno/família. Isso fica registrado e é considerado na decisão.' },
      { subtitulo: "Confirmar ciência" },
      { p: 'Confirma que o responsável tomou conhecimento da comunicação. Isso NÃO significa concordância - o direito de manifestação continua garantido mesmo depois de confirmar ciência. Há um campo de observação opcional.' },
      { subtitulo: "Pedido de reconsideração" },
      { p: "Depois que uma decisão com sanção é tomada e o responsável toma ciência dela, esta tela passa a oferecer também a opção de pedir reconsideração, dentro do prazo de 15 dias corridos." },
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
  pdf.setTitle("Manual do Usuário - Sistema Disciplinar CPM");
  pdf.setProducer("Sistema Disciplinar CPM");

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = null;
  let y = 0;
  const contentPages = [];
  const capituloDaPagina = [];
  let capituloAtual = "";

  function newPage() {
    page = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
    contentPages.push(page);
    capituloDaPagina.push(capituloAtual);
    return page;
  }

  function ensureSpace(needed) {
    if (y - needed < MARGIN + 26) newPage();
  }

  function heading(text, opts = {}) {
    const size = opts.size ?? 13.5;
    ensureSpace(size + 20);
    y -= 4;
    page.drawText(text, { x: MARGIN, y, size, font: bold, color: NAVY });
    y -= size + 4;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + CONTENT_W, y }, thickness: 0.75, color: REGRA });
    y -= 12;
  }

  function subtitulo(text) {
    ensureSpace(18);
    page.drawText(text, { x: MARGIN, y, size: 11, font: bold, color: NAVY });
    y -= 17;
  }

  function paragraph(text) {
    const size = 10;
    const lineHeight = size * 1.5;
    for (const line of wrapText(text, regular, size, CONTENT_W)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: MARGIN, y, size, font: regular, color: TEXTO });
      y -= lineHeight;
    }
    y -= 6;
  }

  function bullets(items) {
    const size = 10;
    const lineHeight = size * 1.5;
    const indent = 14;
    for (const item of items) {
      const lines = wrapText(item, regular, size, CONTENT_W - indent);
      lines.forEach((line, i) => {
        ensureSpace(lineHeight);
        if (i === 0) page.drawText("-", { x: MARGIN, y, size, font: bold, color: ACENTO });
        page.drawText(line, { x: MARGIN + indent, y, size, font: regular, color: TEXTO });
        y -= lineHeight;
      });
    }
    y -= 6;
  }

  function passos(items) {
    const size = 10;
    const lineHeight = size * 1.5;
    const indent = 18;
    items.forEach((item, idx) => {
      const lines = wrapText(item, regular, size, CONTENT_W - indent);
      lines.forEach((line, i) => {
        ensureSpace(lineHeight);
        if (i === 0) {
          page.drawText(`${idx + 1}.`, { x: MARGIN, y, size, font: bold, color: ACENTO });
        }
        page.drawText(line, { x: MARGIN + indent, y, size, font: regular, color: TEXTO });
        y -= lineHeight;
      });
    });
    y -= 6;
  }

  async function imagem(filename) {
    const filePath = path.join(IMG_DIR, filename);
    if (!fs.existsSync(filePath)) {
      paragraph(`[print indisponível: ${filename}]`);
      return;
    }
    const bytes = fs.readFileSync(filePath);
    const png = await pdf.embedPng(bytes);
    const usableH = PAGE_H - MARGIN * 2 - 20;
    let w = CONTENT_W;
    let h = (png.height / png.width) * w;
    if (h > usableH) {
      h = usableH;
      w = (png.width / png.height) * h;
    }
    ensureSpace(Math.min(h, usableH) + 14);
    const x = MARGIN + (CONTENT_W - w) / 2;
    page.drawRectangle({ x: x - 1, y: y - h - 1, width: w + 2, height: h + 2, borderColor: REGRA, borderWidth: 1 });
    page.drawImage(png, { x, y: y - h, width: w, height: h });
    y -= h + 14;
  }

  async function renderSecao(secao) {
    ensureSpace(90);
    heading(secao.titulo);
    if (secao.screenshot) await imagem(secao.screenshot);
    for (const bloco of secao.blocos) {
      if (bloco.p) paragraph(bloco.p);
      else if (bloco.subtitulo) subtitulo(bloco.subtitulo);
      else if (bloco.bullets) bullets(bloco.bullets);
      else if (bloco.passos) passos(bloco.passos);
    }
  }

  // ---- Capa -----------------------------------------------------------
  const cover = pdf.addPage([PAGE_W, PAGE_H]);
  {
    let cy = PAGE_H - 110;
    const center = (text, size, font, color) => {
      const w = font.widthOfTextAtSize(text, size);
      cover.drawText(text, { x: (PAGE_W - w) / 2, y: cy, size, font, color });
    };
    center("POLÍCIA MILITAR DA BAHIA", 11, bold, MUTED);
    cy -= 18;
    center(UNIDADE.toUpperCase(), 12, bold, NAVY);
    cy -= 90;
    center("MANUAL DO USUÁRIO", 26, bold, NAVY);
    cy -= 32;
    center("Sistema Disciplinar CPM", 15, regular, TEXTO);
    cy -= 60;
    cover.drawLine({ start: { x: PAGE_W / 2 - 90, y: cy }, end: { x: PAGE_W / 2 + 90, y: cy }, thickness: 1, color: ACENTO });
    cy -= 40;
    center("Guia de uso por nível de acesso", 12, italic, MUTED);
    cy -= 200;
    center(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 10, regular, MUTED);
  }

  // ---- Introducao -------------------------------------------------------
  capituloAtual = "Introdução";
  newPage();
  heading("Sobre este manual");
  paragraph("Este manual explica como usar o Sistema Disciplinar CPM no dia a dia, tela por tela, organizado pelos grupos de acesso que existem no colégio. Ele não cobre o perfil Administrador (uso técnico, restrito).");
  paragraph("Cada pessoa vê, dentro do sistema, somente os menus e telas do seu próprio grupo - o que aparece no seu login pode ser um pouco menor do que o mostrado aqui, dependendo do perfil exato.");
  subtitulo("Os grupos de acesso");
  for (const g of GRUPOS_INTRO) {
    ensureSpace(50);
    page.drawText(g.grupo, { x: MARGIN, y, size: 11, font: bold, color: ACENTO });
    y -= 15;
    bullets([g.perfis.join(", ")]);
    paragraph(g.nota);
  }

  // ---- Acesso ao sistema --------------------------------------------
  capituloAtual = "Acesso ao sistema";
  for (const secao of SECOES) {
    newPage();
    await renderSecao(secao);
  }

  // ---- Grupo Comando ---------------------------------------------------
  capituloAtual = "Grupo Comando";
  newPage();
  heading("Grupo Comando");
  paragraph("Diretor PM, Diretor-Adjunto, Chefe do Corpo de Alunos, Comandante de Companhia e Comandante de Pelotão. É o grupo com mais acesso dentro do sistema (fora do Administrador): conduz o processo disciplinar do início ao fim e administra os cadastros do colégio.");
  for (const secao of SECOES_COMANDO) {
    newPage();
    await renderSecao(secao);
  }

  // ---- Grupo Professor -------------------------------------------------
  capituloAtual = "Grupo Professor / Militar / Funcionário";
  newPage();
  heading("Grupo Professor / Militar / Funcionário");
  paragraph("Professor, Militar e Funcionário registram comunicações disciplinares, mas não conduzem o processo (enquadramento, decisão e sanção ficam com o Grupo Comando). O Professor tem, a mais, acesso de leitura ao comportamento dos alunos e aos catálogos disciplinares.");
  for (const secao of SECOES_PROFESSOR) {
    newPage();
    await renderSecao(secao);
  }

  // ---- Grupo Responsavel -------------------------------------------
  capituloAtual = "Grupo Responsável";
  newPage();
  heading("Grupo Responsável");
  paragraph("Portal próprio, separado do restante do sistema, pensado para uso pelo celular. O responsável acompanha exclusivamente os processos dos próprios filhos: recebe a comunicação, pode se manifestar, confirma ciência e, quando cabível, pede reconsideração.");
  for (const secao of SECOES_RESPONSAVEL) {
    newPage();
    await renderSecao(secao);
  }

  // ---- Cabecalho + rodape em todas as paginas de conteudo -----------
  const total = contentPages.length;
  contentPages.forEach((p, idx) => {
    p.drawText(capituloDaPagina[idx] || UNIDADE, { x: MARGIN, y: PAGE_H - 32, size: 8, font: regular, color: MUTED });
    p.drawLine({ start: { x: MARGIN, y: PAGE_H - 38 }, end: { x: PAGE_W - MARGIN, y: PAGE_H - 38 }, thickness: 0.5, color: REGRA });
    const rodape = `Manual do Usuário - Sistema Disciplinar CPM - Página ${idx + 1} de ${total}`;
    const w = regular.widthOfTextAtSize(rodape, 8);
    p.drawText(rodape, { x: PAGE_W - MARGIN - w, y: MARGIN - 22, size: 8, font: regular, color: MUTED });
  });

  const bytes = await pdf.save();
  const outDir = path.join(__dirname, "..", "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "Manual-do-Usuario-Sistema-Disciplinar-CPM.pdf");
  fs.writeFileSync(outPath, bytes);
  console.log("PDF gerado em:", outPath);
  console.log("Paginas:", pdf.getPageCount());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
