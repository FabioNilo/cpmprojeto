# Deploy em produção (EasyPanel)

O banco de dados (Postgres + Storage de anexos) já roda no Supabase, fora
deste deploy. Este documento cobre só a aplicação Next.js.

Repositório: https://github.com/FabioNilo/cpmprojeto (privado). Deploy via
EasyPanel a partir deste repo Git, branch `main`.

**Decisão da fase beta (2026-09-25)**: o app em produção/beta aponta para o
schema `cpm` do Supabase (dados reais dos ~1220 alunos do CPM Rômulo Galvão,
já importados) — não um schema isolado. Ou seja, a fase beta já é uso real,
não um ambiente de testes com dados fictícios.

## 1. Pré-requisitos já resolvidos

- `Dockerfile` (multi-stage: `deps` → `builder` → `runner`, Next.js
  `output: "standalone"`) e `docker-entrypoint.sh` (roda
  `prisma migrate deploy` antes de subir o servidor) prontos no repositório.
- `docker-compose.yml` na raiz é o compose de **produção**: um único serviço
  `app`, sem banco local (usa o Supabase via `DATABASE_URL`).
- `binaryTargets` do Prisma (`prisma/schema.prisma`) já inclui
  `linux-musl-openssl-3.0.x`, o alvo do Alpine — não precisa mexer.
- Bucket de anexos `anexos-disciplina` já existe no Supabase Storage
  (privado, limite 10 MB, mimetypes documentados/PDF/imagem/Word/texto).

## 2. Variáveis de ambiente a cadastrar no EasyPanel

No app criado a partir deste `docker-compose.yml`, aba **Environment**,
cadastre (nunca versione valores reais no repositório):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | conexão Postgres do Supabase, **session pooler porta 5432** (não 6543), com `?schema=cpm` |
| `SESSION_COOKIE_NAME` | `cpm_session` |
| `SESSION_SECRET` | valor aleatório forte, **diferente** do de dev (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_NAME` | `Sistema Disciplinar CPM` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave `service_role` (Project Settings → API) |
| `SUPABASE_STORAGE_BUCKET` | `anexos-disciplina` |

O `docker-compose.yml` só referencia `${VAR}` — o EasyPanel injeta os
valores no container a partir dessa aba antes de interpolar o compose.

## 3. Deploy

1. No EasyPanel, criar o app a partir deste repositório Git, método
   **Docker Compose** (usa o `docker-compose.yml` da raiz).
2. Preencher as variáveis da tabela acima.
3. Configurar a porta do serviço `app` como **3000** (é o que o container
   expõe) e o domínio/HTTPS pelo próprio EasyPanel.
4. Disparar o deploy. No primeiro start, o `docker-entrypoint.sh` roda
   `prisma migrate deploy` (idempotente — só aplica o que falta) e então
   inicia `node server.js`.
5. Conferir o healthcheck (`GET /login`) e os logs do container.

## 4. Migrations em deploys seguintes

Com **uma única réplica** (o cenário aqui), rodar `migrate deploy` a cada
start é seguro — não é preciso nenhum passo manual. Se um dia o app rodar
com múltiplas réplicas simultâneas, defina `SKIP_MIGRATIONS=1` nas réplicas
extras e aplique a migration uma única vez (manual ou num job dedicado)
antes do rollout, para não correr `migrate deploy` em paralelo.

## 5. Checklist antes de ir ao ar

- [ ] Rotacionar a senha do banco Supabase e o JWT secret/API keys, se ainda
      não foi feito (foram expostos em uma conversa anterior).
- [ ] `SESSION_SECRET` de produção gerado do zero (não reaproveitar o de dev;
      gerar direto no terminal, nunca colar um valor pronto no chat/histórico
      — ex.: `openssl rand -base64 32`).
- [ ] `.env` real nunca commitado (`.dockerignore` e `.gitignore` já cobrem;
      confirmado no `git status` antes do primeiro push).
- [x] Decidido (2026-09-25): schema `cpm` (dados reais) é o banco do beta.
- [ ] Rodar `npm run test:integration` contra `cpm_test` antes do primeiro
      deploy grande.
- [ ] Confirmar que o domínio escolhido para o beta tem DNS (registro A)
      apontando para o IP da VPS antes de pedir o certificado HTTPS no
      EasyPanel (ele usa Let's Encrypt, que valida o domínio por HTTP).
