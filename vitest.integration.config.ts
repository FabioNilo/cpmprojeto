import { fileURLToPath } from "node:url";

import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Carrega .env / .env.local (sem prefixo -> todas as chaves).
const fileEnv = loadEnv("test", process.cwd(), "");

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  fileEnv.TEST_DATABASE_URL ??
  "postgresql://cpm:cpm_dev_password@localhost:5435/cpm_disciplinar_test?schema=public";

// Propaga para o globalSetup (roda no processo principal) e para o execSync.
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.TEST_DATABASE_URL = TEST_DATABASE_URL;

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/integration/**/*.test.ts"],
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
    globalSetup: ["src/tests/integration/global-setup.ts"],
    setupFiles: ["src/tests/integration/setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./src/tests/integration/stubs/empty.ts", import.meta.url),
      ),
      "client-only": fileURLToPath(
        new URL("./src/tests/integration/stubs/empty.ts", import.meta.url),
      ),
    },
  },
});
