import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://cpm:cpm_dev_password@localhost:5435/cpm_disciplinar_test?schema=public";

export default defineConfig({
  testDir: "./",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: { DATABASE_URL: TEST_DATABASE_URL },
      },
});
