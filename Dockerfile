# syntax=docker/dockerfile:1

# ---- deps: instala node_modules (cacheavel enquanto o lockfile nao muda) ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: gera o client do Prisma e o build standalone do Next ----
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# "prisma generate" (chamado abaixo e de novo dentro de "npm run build")
# so LE o schema.prisma, nunca conecta no banco - mas exige que a env var
# do datasource exista, senao falha na validacao. As credenciais reais so
# existem em runtime (aba Environment do EasyPanel); aqui e so um valor
# fake, descartado ao fim desta etapa (nao vai para a imagem final/runner).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# "prisma generate" roda aqui dentro do Alpine: o binary target musl fica
# correto sem depender de onde o build foi disparado.
RUN npx prisma generate
RUN npm run build

# ---- runner: imagem final, enxuta, sem devDependencies ----
FROM node:22-alpine AS runner
# openssl e obrigatorio para o query engine do Prisma no Alpine (musl).
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --chown=nextjs:nodejs --from=builder /app/public ./public
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static

# O output "standalone" do Next traz um node_modules reduzido (so o que o
# tracing detectou para o server.js). O entrypoint precisa rodar o CLI do
# Prisma ("migrate deploy"), que arrasta dependencias proprias
# (@prisma/engines etc.) que o tracing nao inclui. Sobrescrever com o
# node_modules completo do builder resolve isso de vez, sem cherry-picking
# fragil de subpastas. "--chown" no COPY (em vez de um "RUN chown -R"
# separado) evita uma segunda varredura lenta de todo o node_modules.
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
