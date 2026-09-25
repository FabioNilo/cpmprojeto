# Testes de integração e e2e

Cobrem os testes prioritários da fundação (`docs/ARQUITETURA_TECNICA.md` §13) contra um
PostgreSQL real, além de um smoke e2e no navegador.

## Pré-requisitos

- Docker (para o banco de teste efêmero `db-test`, porta host **5435**, dados em `tmpfs`).
- `@playwright/test` instalado (`npm install`) e navegador baixado (`npx playwright install chromium`)
  apenas para os testes e2e.

## Integração (Vitest + Prisma)

```bash
npm run db:test:up                 # sobe o Postgres de teste (tmpfs, some ao parar)
npm run test:integration           # migrate deploy + suites em src/tests/integration/**
npm run db:test:down               # opcional
```

- `vitest.integration.config.ts` roda em série (`fileParallelism: false`), aplica todas as migrations
  via `global-setup.ts` e trunca todas as tabelas antes de cada teste (`setup.ts` → `helpers/reset-db.ts`).
- `DATABASE_URL` do teste vem de `TEST_DATABASE_URL` (padrão
  `postgresql://cpm:cpm_dev_password@localhost:5435/cpm_disciplinar_test?schema=public`).
- Server Actions que dependem de `next/headers` usam um mock de cookies/headers no topo do arquivo de
  teste (`vi.mock("next/headers", ...)`).

### Cobertura (§13)

| Cenário da §13 | Arquivo |
|---|---|
| login com credenciais válidas | `auth-login.test.ts` |
| falha de login sem revelar se o usuário existe | `auth-login.test.ts` |
| usuário sem permissão recebe bloqueio + auditoria `ACESSO_NEGADO` | `rbac-guard.test.ts` |
| usuário com permissão acessa | `rbac-guard.test.ts` |
| tenant não trocável por parâmetro do cliente (`TROCA_COLEGIO_NEGADA`) | `tenancy.test.ts` |
| troca de tenant válida grava `TROCA_COLEGIO_ATIVO` | `tenancy.test.ts` |
| seed cria perfis e permissões iniciais | `seed.test.ts` |
| rate limiting de login (ledger `tentativas_login`) | `login-throttle.test.ts` |

Pendente (e2e cobre parcialmente): "usuário sem sessão não acessa rota protegida" e "usuário sem
vínculo ativo ao colégio não acessa" — o segundo entra quando o F4 (matrículas) estabilizar o fluxo.

## e2e (Playwright)

```bash
npm run db:test:up
npx prisma migrate deploy   # com DATABASE_URL apontando para :5435
npm run prisma:seed         # idem — cria admin / Admin@12345
npm run build && npm run test:e2e
```

`e2e/playwright.config.ts` sobe `npm run start` automaticamente (a menos que `E2E_BASE_URL` esteja
definido) com `DATABASE_URL` do banco de teste.
