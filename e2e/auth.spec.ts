import { expect, test } from "@playwright/test";

test("rota protegida redireciona para /login quando nao autenticado", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("tela de login publica renderiza os campos de credencial", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(page.locator('input[name="identifier"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("login com credenciais do seed abre o dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.locator('input[name="identifier"]').fill("admin");
  await page.locator('input[name="password"]').fill("Admin@12345");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("navigation", { name: /navegacao/i })).toBeVisible();
});

test("credencial invalida mantem o usuario no login com mensagem generica", async ({
  page,
}) => {
  await page.goto("/login");
  await page.locator('input[name="identifier"]').fill("nao.existe");
  await page.locator('input[name="password"]').fill("SenhaErrada@1");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByText("CPF/usuario ou senha invalidos.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
