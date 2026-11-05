// Captura as telas do manual a partir de um app LOCAL com dados ficticios
// (ver scripts/manual-dados-ficticios.cjs). As imagens ficam em .manual-telas/,
// fora do git, e sao lidas por scripts/gerar-manual-usuario.cjs.
// Uso: BASE_URL=http://localhost:3100 node scripts/manual-capturar-telas.cjs

const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
if (!/^http:\/\/(localhost|127\.0\.0\.1)/.test(BASE)) {
  throw new Error("Recusado: as telas do manual so podem vir de um app local.");
}
const SENHA = "Manual@12345";
const SAIDA = path.join(__dirname, "..", ".manual-telas");

async function login(browser, usuario, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1.5 });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="identifier"]', usuario);
  await page.fill('input[name="password"]', SENHA);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 120000 }),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
  return { context, page };
}

async function foto(page, rota, arquivo, fullPage = false) {
  await page.goto(`${BASE}${rota}`, { waitUntil: "load", timeout: 120000 });
  // Esconde o indicador do modo de desenvolvimento do Next.
  await page.waitForTimeout(1500);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.screenshot({ path: path.join(SAIDA, arquivo), fullPage });
  console.log(arquivo);
}

async function hrefDe(page, rota, seletor) {
  await page.goto(`${BASE}${rota}`, { waitUntil: "load", timeout: 120000 });
  await page.locator(seletor).first().waitFor({ state: "attached", timeout: 30000 });
  return page.locator(seletor).first().getAttribute("href");
}

(async () => {
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(SAIDA, { recursive: true });
  const browser = await chromium.launch();
  const desktop = { width: 1280, height: 900 };
  const celular = { width: 430, height: 900 };

  const anonimo = await browser.newContext({ viewport: desktop, deviceScaleFactor: 1.5 });
  const paginaLogin = await anonimo.newPage();
  await foto(paginaLogin, "/login", "00-login.png");
  await anonimo.close();

  const comando = await login(browser, "demo.comando", desktop);
  const p = comando.page;
  await foto(p, "/dashboard", "10-comando-dashboard.png", true);
  await foto(p, "/disciplina/ocorrencias/nova", "11-comando-nova-comunicacao.png", true);
  await foto(p, "/disciplina/ocorrencias", "12-comando-ocorrencias-lista.png");
  const ocorrencia = await hrefDe(p, "/disciplina/ocorrencias", 'a[href^="/disciplina/ocorrencias/"]:not([href$="/nova"])');
  await foto(p, ocorrencia, "13-comando-ocorrencia-detalhe.png", true);
  await foto(p, "/disciplina/comportamento", "14-comando-comportamento-lista.png");
  const extrato = await hrefDe(p, "/disciplina/comportamento?faixa=&acompanhamento=", 'a[href^="/disciplina/comportamento/"]');
  await foto(p, extrato, "15-comando-comportamento-extrato.png");
  await foto(p, "/disciplina/reconsideracoes", "16-comando-reconsideracoes.png");
  await foto(p, "/disciplina/painel", "17-comando-painel.png", true);
  await foto(p, "/usuarios", "18-comando-usuarios.png");
  await foto(p, "/responsaveis", "19-comando-responsaveis.png");
  await foto(p, "/matriculas", "20-comando-matriculas.png");
  await foto(p, "/turmas", "21-comando-turmas.png");
  await foto(p, "/disciplina/catalogos", "22-comando-catalogos.png");
  await comando.context.close();

  const professor = await login(browser, "demo.professor", desktop);
  await foto(professor.page, "/dashboard", "30-professor-dashboard.png");
  await foto(professor.page, "/disciplina/ocorrencias/nova", "31-professor-nova-comunicacao.png");
  await foto(professor.page, "/disciplina/ocorrencias", "32-professor-ocorrencias-lista.png");
  await foto(professor.page, "/disciplina/comportamento", "33-professor-comportamento.png");
  await professor.context.close();

  const responsavel = await login(browser, "demo.responsavel", celular);
  await foto(responsavel.page, "/meus-filhos", "40-responsavel-meus-filhos.png", true);
  const processo = await hrefDe(responsavel.page, "/meus-filhos", 'a[href^="/meus-filhos/"]');
  await foto(responsavel.page, processo, "41-responsavel-processo-detalhe.png", true);
  await responsavel.context.close();

  await browser.close();
})().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
