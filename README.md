# Sistema Disciplinar CPM

Fundacao tecnica do Sistema de Acompanhamento Disciplinar dos Colegios da
Policia Militar.

## Escopo atual

Sistema em uso no CPM Romulo Galvao: Next.js (App Router), TypeScript, Prisma e
PostgreSQL, com autenticacao propria, multi-tenancy por colegio, RBAC, auditoria,
cadastros-base, modulo disciplinar completo e portal do responsavel.

Registros com relevancia historica sao inativados, encerrados ou transferidos,
nao apagados fisicamente.

Ver tambem `docs/DEPLOY.md` e `docs/LGPD.md`.

## Modelo de aluno transferivel

`Aluno` representa a identidade continua do estudante entre CPMs. A relacao do
aluno com cada unidade fica em `AlunoVinculoColegio`, permitindo transferencia
entre colegios sem duplicar o aluno nem perder o historico disciplinar futuro.

Quando houver transferencia, o CPM de destino deve ganhar vinculo formal com o
mesmo `alunoId`, e os responsaveis vinculados ao aluno devem receber acesso no
novo contexto de colegio conforme RBAC.

A transferencia de aluno e uma operacao do CPM de origem. Ela preserva a
`matriculaGeral`, inativa a matricula/vinculo ativo da origem, cria vinculo
ativo no destino e cria matricula no destino quando uma turma for selecionada.
Os responsaveis recebem acesso ao destino com perfil `RESPONSAVEL`; o acesso
antigo na origem e desativado quando nao houver outro aluno ativo do mesmo
responsavel naquele CPM.

Podem transferir alunos entre CPMs os perfis `ADMINISTRADOR`, `DIRETOR_PM`,
`DIRETOR_ADJUNTO` e `CHEFE_CORPO_ALUNOS`.

`DIRETOR_PM` e `DIRETOR_ADJUNTO` gerenciam usuarios, alunos, responsaveis e
turmas somente no CPM ativo. Eles nao acessam a aba `Colegios` e nao podem
visualizar ou alterar usuarios com perfil `ADMINISTRADOR`.

## Setup local

```bash
npm install
cp .env.example .env
docker compose up -d db
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

O PostgreSQL local deste projeto usa a porta `5434` no host para evitar conflito
com outros containers Postgres ja existentes.

O seed cria as contas de exemplo `admin`, `diretor` e `responsavel`. As senhas
de exemplo, definidas em `prisma/seed.ts`, so valem em banco local ou de teste.
Em qualquer outro banco, a conta nasce com a senha de `SEED_SENHA_<USUARIO>` ou
com uma senha aleatoria.

O seed cria duas unidades CPM e permite trocar o colegio ativo com o usuario
`diretor`, que possui perfil `DIRETOR_PM` nas duas unidades. A troca de colegio
fica restrita a vinculos ativos com perfis que tenham a permissao
`tenancy.switch`: `CHEFE_CORPO_ALUNOS`, `DIRETOR_ADJUNTO`, `DIRETOR_PM` e
`ADMINISTRADOR`.

## Validacao

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```
