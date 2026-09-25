import { execSync } from "node:child_process";

// A config (vitest.integration.config.ts) ja resolveu e exportou o alvo em
// process.env.DATABASE_URL / TEST_DATABASE_URL.
const TEST_DATABASE_URL =
  process.env.DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  "postgresql://cpm:cpm_dev_password@localhost:5435/cpm_disciplinar_test?schema=public";

export default function globalSetup() {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
