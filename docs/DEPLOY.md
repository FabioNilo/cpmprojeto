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
- [ ] Confirmar que `admin`, `diretor` e `responsavel` não aceitam mais as
      senhas de exemplo em produção. Trocar a senha ou inativar a conta.
- [ ] Usar o usuário restrito `cpm_app` (seção 7) e ter backup testado (seção 8).
- [ ] `.env` real nunca commitado (`.dockerignore` e `.gitignore` já cobrem;
      confirmado no `git status` antes do primeiro push).
- [x] Decidido (2026-09-25): schema `cpm` (dados reais) é o banco do beta.
- [x] `npm run test:integration` rodado contra `cpm_test` (7 arquivos/16
      testes verdes, 2026-09-25).
- [x] Confirmar que o domínio escolhido para o beta tem DNS (registro A)
      apontando para o IP da VPS antes de pedir o certificado HTTPS no
      EasyPanel (ele usa Let's Encrypt, que valida o domínio por HTTP).

## 6. Primeiro deploy (2026-09-25) — feito, app no ar

Serviço tipo **App** no EasyPanel (não Compose — ver nota na seção 1),
builder Dockerfile, repositório `FabioNilo/cpmprojeto`. Dois problemas
apareceram e foram corrigidos:

- Build da imagem falhava com `Environment variable not found:
  DATABASE_URL` — `prisma generate` roda durante o build (que não tem acesso
  às variáveis da aba Environment, só disponíveis em runtime) e exige a env
  var presente para validar o schema, mesmo sem conectar no banco de
  verdade. Fix: `ENV DATABASE_URL` com valor fake só na etapa `builder` do
  `Dockerfile` (commit `cec33c8`) — não vaza pra imagem final.
- Depois do fix de build, o mesmo erro voltou em **runtime** (no
  `prisma migrate deploy` do `docker-entrypoint.sh`) — causa era um typo do
  usuário na aba Environment (faltava o "D" de `DATABASE_URL`). Corrigido
  direto no painel, sem mudança de código.

App confirmado no ar.

## 7. Rotação de credenciais e usuário restrito

Hoje o app acessa o banco com o usuário `postgres`, que também alcança o outro
sistema do mesmo projeto Supabase. Faça estes passos em um horário sem uso, pois
o app fica fora do ar entre os passos 2 e 5:

1. No Supabase, **Project Settings → Database**: redefina a senha do banco.
2. Gere a senha do novo usuário no seu terminal: `openssl rand -hex 32`.
3. No **SQL Editor**, cole `docs/sql/criar-usuario-restrito-cpm.sql`, troque
   `TROQUE_ESTA_SENHA` só no editor e execute. Confira o resultado:
   `acesso_cpm = true`, `le_tabelas_public = false` e
   `tem_privilegio_elevado = false`.
4. No EasyPanel, altere `DATABASE_URL`, mantendo host, porta 5432 e `?schema=cpm`:
   `postgresql://cpm_app.<ref>:<senha>@<host-do-pooler>:5432/postgres?schema=cpm`
5. Refaça o deploy e teste login, abertura de um processo e download de anexo.
6. Em **Project Settings → API**, rotacione a chave `service_role` e o JWT secret
   e atualize `SUPABASE_SERVICE_ROLE_KEY`. Ao rotacionar o JWT secret, o outro
   sistema do projeto também precisa receber as novas chaves.
7. Atualize o `.env` local. Os testes de integração em `cpm_test` continuam com
   o usuário `postgres`.

Nunca cole senhas no chat nem salve no repositório.

**Recuperação de senha:** um gestor gera o link temporário em `/usuarios` ou
`/responsaveis`, e só um administrador gera link para outro administrador.
Mantenha pelo menos dois administradores ativos. Se o único administrador perder
a senha, será preciso gravar um novo hash bcrypt em `usuarios.password_hash`
pelo SQL Editor, com registro do motivo.

## 8. Backup

Antes de confiar no backup, confirme no painel do Supabase o plano do projeto e
se há backups disponíveis. Projetos do plano gratuito podem ser pausados por
inatividade, então verifique também o status do projeto.

Para uma cópia manual do schema `cpm`, sem precisar instalar o Postgres (use a
imagem com a mesma versão principal do banco e a conexão **do pooler**):

```bash
docker run --rm -e DATABASE_URL="$DATABASE_URL_SEM_SCHEMA" -v "$PWD/backup-cpm:/backup" \
  postgres:17-alpine sh -c \
  'pg_dump "$DATABASE_URL" --schema=cpm --format=custom --file=/backup/cpm-$(date +%F).dump'
```

`DATABASE_URL_SEM_SCHEMA` é a conexão sem o trecho `?schema=cpm`.

- O arquivo contém dados reais de alunos: criptografe (por exemplo, com 7-Zip e
  AES-256) e guarde fora do repositório e fora de pastas sincronizadas.
- Os anexos ficam no bucket `anexos-disciplina` e **não** entram nesse arquivo.
- Backup só vale depois de testado: restaure em um banco descartável pelo menos
  uma vez.
