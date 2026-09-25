#!/bin/sh
# Ponto de entrada do container de producao.
#
# Aplica as migrations pendentes do Prisma antes de subir o servidor.
# "migrate deploy" so aplica o que falta e nao pede confirmacao -- seguro
# de rodar a cada start com uma unica replica (o caso do EasyPanel aqui).
# Se um dia isso rodar com varias replicas simultaneas, defina
# SKIP_MIGRATIONS=1 nas replicas extras e aplique a migration manualmente
# (ou num container/job dedicado) antes do rollout.
set -e

if [ "$SKIP_MIGRATIONS" = "1" ]; then
  echo "SKIP_MIGRATIONS=1: pulando 'prisma migrate deploy'."
else
  echo "Aplicando migrations pendentes (prisma migrate deploy)..."
  npx prisma migrate deploy
fi

echo "Iniciando servidor..."
exec "$@"
