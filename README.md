# Sistema Disciplinar CPM

Fundacao tecnica do Sistema de Acompanhamento Disciplinar dos Colegios da
Policia Militar.

## Escopo atual

Esta etapa implementa apenas:

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Docker
- autenticacao por credenciais
- multi-tenancy por colegio
- RBAC
- auditoria basica
- cadastros-base iniciais de colegios, usuarios, alunos, responsaveis, turmas e
  matriculas
- transferencia cadastral de aluno entre CPMs, sem regras disciplinares

O CRUD cadastral usa exclusao logica: registros com relevancia historica sao
inativados, encerrados ou transferidos, nao apagados fisicamente.

O modulo disciplinar ainda nao foi implementado por decisao arquitetural.

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

Credenciais iniciais do seed:

```text
usuario: admin
senha: Admin@12345

usuario: diretor
senha: Diretor@12345

usuario: responsavel
senha: Responsavel@12345
```

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

## Regra de disciplina do projeto

Nenhum modulo disciplinar deve ser implementado antes de auth, tenant, RBAC e
auditoria basica estarem prontos e testados.
