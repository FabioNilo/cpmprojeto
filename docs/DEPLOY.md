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
- `binaryTargets` do Prisma (`prisma/schema.prisma`) já inclui
  `linux-musl-openssl-3.0.x`, o alvo do Alpine — não precisa mexer.
- Bucket de anexos `anexos-disciplina` já existe no Supabase Storage
  (privado, limite 10 MB, mimetypes documentados/PDF/imagem/Word/texto).

**Nota (2026-09-25)**: o `docker-compose.yml` da raiz existe só para deploy
via serviço do tipo **Compose** do EasyPanel. Como este projeto é um único
container sem banco local, é mais simples usar um serviço do tipo **App**
com builder **Dockerfile** direto — é o método usado abaixo. O
`docker-compose.yml` fica no repo como alternativa, não é obrigatório.

## 2. Variáveis de ambiente a cadastrar no EasyPanel

No serviço App, aba **Environment** (formato `.env`, uma linha
`CHAVE=valor` por variável — nunca versione valores reais no repositório):

| Variável | Valor |
|---|---|
| `DATABASE_URL` | conexão Postgres do Supabase, **session pooler porta 5432** (não 6543), com `?schema=cpm` |
| `SESSION_COOKIE_NAME` | `cpm_session` |
| `SESSION_SECRET` | valor aleatório forte, **diferente** do de dev (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_NAME` | `Sistema Disciplinar CPM` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | a chave `service_role` (Project Settings → API) |
| `SUPABASE_STORAGE_BUCKET` | `anexos-disciplina` |

## 3. Deploy

1. No EasyPanel: **+ Create Service → App**, nome do serviço, criar.
2. Na aba **Source**: escolher **GitHub**, repositório
   `FabioNilo/cpmprojeto`, branch `main`, build path `/`.
3. Na aba **Build**: builder **Dockerfile**, caminho `Dockerfile` (raiz).
4. Na aba **Environment**: colar as variáveis da tabela acima.
5. Na aba **Domains**: porta interna **3000**, domínio do beta (DNS já
   apontando pro IP da VPS) — o EasyPanel emite o certificado HTTPS.
6. **Deploy**. No primeiro start, o `docker-entrypoint.sh` roda
   `prisma migrate deploy` (idempotente — só aplica o que falta) e então
   inicia `node server.js`.
7. Conferir os logs do container e o healthcheck (`GET /login`).

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
