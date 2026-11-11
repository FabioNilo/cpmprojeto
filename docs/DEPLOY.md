# Deploy em produção (EasyPanel)

> **Desde 11/11/2026 o banco roda na própria VPS** (seção 0). As seções 1–8
> abaixo descrevem a fase anterior, com o banco no Supabase, e ficam como
> histórico. Os **anexos continuam no Supabase Storage**.

## 0. Situação atual (11/11/2026)

- VPS Hostinger no Brasil, Easypanel. O app é o serviço `cpm` do projeto
  **`yt`** (o Easypanel grátis permite só 3 projetos, todos em uso).
- Banco: serviço Postgres 17 **`cpm-db`** no mesmo projeto, sem porta
  pública. Host interno `yt_cpm-db`, banco `cpm`, schema `cpm`.
  - `cpm` = dono do banco (superusuário do container).
  - `cpm_app` = usuário do app, dono só do schema `cpm`
    (`docs/sql/criar-usuario-restrito-cpm.sql`).
  - `DATABASE_URL=postgresql://cpm_app:<senha>@yt_cpm-db:5432/cpm?schema=cpm`
- Senhas só na VPS: `/root/cpm/secrets.env` (chmod 600). Variáveis do app em
  `/root/cpm/app.env.vps`; as antigas (Supabase) em
  `/root/cpm/app.env.supabase`.
- Motivo da mudança: com o banco no Supabase us-west-2 cada consulta levava
  ~216 ms a partir da VPS; telas lentas e envio de comunicação com 5 alunos
  estourando o tempo limite da transação. Na VPS: ~2 ms.
- Backup: o `cpm-db` entra no backup diário da VPS (`/root/backup/backup.sh`,
  06:30 UTC, `pg_dumpall` cifrado no Cloudflare R2). Restauração testada em
  11/11/2026 (48 tabelas, 17.912 linhas idênticas).
- **Voltar ao Supabase** (se precisar): o schema `cpm` antigo continua lá,
  intacto, mas parado em 11/11/2026 10:53 UTC. Copiar os dados novos de volta
  antes (pg_dump do `cpm-db`) e então
  `ep services.app.updateEnv` com `app.env.supabase` + `deployService`.
- Cópia Supabase → VPS (refazível): `/root/cpm/copiar.sh` (pg_dump do schema,
  restaura no `cpm-db`, recria `cpm_app`, compara as contagens das tabelas).
- `MONITOR_LIMITE_BANCO_MB` ainda é 500 (limite do Supabase Free); na VPS o
  limite real é o disco.

---

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

## 9. Monitor do banco

A rota `/api/saude` mede o banco e responde **200** quando está tudo bem e **503**
quando há atenção ou problema. Um verificador externo gratuito a consulta a cada
poucos minutos e avisa você. A rota é pública e, sem token, devolve só o estado e
os códigos dos alertas, sem números nem dados de alunos.

| Resposta | Significa |
|---|---|
| `{"status":"ok","alertas":[]}` | Tudo dentro dos limites. |
| `status: "atencao"` | Algum limite passou do primeiro nível. |
| `status: "critico"` | Banco fora do ar (`BANCO_FORA`) ou limite quase esgotado. |

Códigos de alerta: `BANCO_FORA` (não respondeu em 8 s: pausado, fora do ar ou
inalcançável), `BANCO_LENTO` (acima de 1,5 s atenção, 5 s crítico),
`TAMANHO_ALTO` (70% atenção, 90% crítico do limite) e `CONEXOES_ALTAS` (80% e 95%).

**Variáveis (opcionais, aba Environment do EasyPanel):**

| Variável | Valor |
|---|---|
| `MONITOR_LIMITE_BANCO_MB` | Limite do plano. Free = `500` (padrão), Pro = `8192`. O limite vale para o projeto inteiro, inclusive o outro sistema que usa o mesmo projeto Supabase. |
| `MONITOR_TOKEN` | Gere com `openssl rand -hex 24`. Com ele, a rota devolve também as medidas. |

**Ver os números** (troque o endereço e o token):

```bash
curl -s https://SEU-DOMINIO/api/saude -H "Authorization: Bearer SEU_TOKEN"
```

**Configurar o aviso (exemplo com o UptimeRobot, plano gratuito):**

1. Crie um monitor do tipo **Keyword** em `https://SEU-DOMINIO/api/saude`.
2. Palavra-chave: `"status":"ok"`, alertando quando **não existir**. Intervalo: 5 minutos.
3. Em **Alert Contacts**, conecte o Telegram (ou outro canal) e associe ao monitor.
4. Teste: pare o banco local ou use uma conexão inválida e confira se o aviso chega.

Cuidados:

- O resultado fica em memória por 1 minuto, então consultas seguidas não pesam no banco.
- Não use `/api/saude` como health check do EasyPanel: se o banco cair, o painel
  reiniciaria o app sem necessidade. Mantenha `/login` para isso.
- As consultas regulares geram atividade no banco, o que pode reduzir o risco de
  pausa por inatividade no plano gratuito. Não conte com isso como garantia:
  confirme a regra atual de pausa na documentação do Supabase.
- As conexões contadas incluem as do outro sistema do mesmo projeto e as internas
  do Supabase. O limite real do pooler pode ser menor que `max_connections`.

### Se o Supabase não der conta

O monitor só avisa. O que levar para a Cloudflare R2, nesta ordem:

1. **Backups diários do Postgres** (seção 8) enviados ao R2, com restauração testada.
2. **Anexos** (`anexos-disciplina`) no R2, com URL assinada de curta duração. O padrão
   já existe em `C:\get\clinica-odonto-boletos\lib\storage\core.ts` (driver
   `r2`, SDK S3, bucket privado, nunca sobrescreve). Falta adaptar
   `src/lib/storage/supabase-storage.ts`; **ainda não foi feito**.
3. **Banco inteiro** só em último caso: novo Postgres, `pg_dump` do schema `cpm`,
   restauração, troca da `DATABASE_URL` e teste de login e abertura de um processo.

Com 9,7 MB no schema `cpm` e 31,4 MB no projeto (medição de 07/11/2026), o tamanho
não é o risco do momento; a pausa por inatividade é.
