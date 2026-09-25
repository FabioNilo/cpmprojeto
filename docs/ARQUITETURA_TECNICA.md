# Arquitetura Tecnica - Sistema Disciplinar dos CPMs

Este documento consolida a arquitetura tecnica aprovada para a primeira etapa do
Sistema de Acompanhamento Disciplinar dos Colegios da Policia Militar.

Fonte normativa e funcional inicial:

- `PLANEJAMENTO_CLAUDE_CODE_CPM.md`
- Regimento Escolar dos Colegios da Policia Militar da Bahia - 2026
- Anexo A - Das Normas Disciplinares

Este documento nao altera regras disciplinares. Quando houver duvida funcional,
a regra deve ser registrada explicitamente e nao simplificada silenciosamente.

## 1. Escopo desta etapa

A primeira etapa deve entregar somente a fundacao tecnica:

- Next.js com App Router
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Docker e docker-compose
- Autenticacao por credenciais internas
- Multi-tenancy por colegio
- RBAC por colegio
- Auditoria basica
- Tela inicial de login
- Bloqueio de rotas protegidas
- Estrutura modular
- Testes da fundacao

Fora do escopo desta etapa:

- ocorrencias disciplinares
- manifestacoes
- ciencias
- enquadramentos
- sancoes
- pontuacao disciplinar
- reconsideracoes
- ficha disciplinar
- dashboard disciplinar

O modulo disciplinar so deve iniciar depois de auth, tenant, RBAC e auditoria
estarem prontos e testados.

## 2. Principios arquiteturais

1. Monolito modular.
2. Regras criticas sempre no servidor.
3. Interface nao e fronteira de seguranca.
4. Tenant resolvido pela sessao, nao por parametros enviados pelo cliente.
5. RBAC avaliado por usuario, colegio, perfil e permissao.
6. Dados disciplinares historicos nao devem ser apagados fisicamente.
7. Auditoria deve nascer junto com o sistema, nao ser adicionada no fim.
8. Catalogos regulamentares devem ficar em tabelas quando puderem mudar.
9. Enums devem ser usados apenas para valores realmente estaveis.
10. Pontuacao disciplinar deve usar livro-razao, nao campo agregado como fonte da verdade.
11. Modulos React devem focar em interface; regra de negocio fica em servicos.
12. Migrations devem ser pequenas e revisaveis.

Cadastros-base tambem devem preferir inativacao, encerramento ou transferencia
em vez de exclusao fisica quando houver vinculos historicos, auditoria,
matricula, usuario, responsavel ou aluno envolvidos.

## 3. Arquitetura geral

```text
Browser
  |
  v
Next.js App Router
  |
  |-- Server Components
  |-- Server Actions
  |-- Route Handlers
  |
  v
Camada de aplicacao
  |
  |-- Auth service
  |-- Tenant service
  |-- RBAC service
  |-- Audit service
  |-- Domain services
  |
  v
Repositories / Prisma Client
  |
  v
PostgreSQL
```

Infraestrutura local:

```text
docker-compose
  |
  |-- app: Next.js
  |-- db: PostgreSQL
```

Infraestrutura futura de producao:

```text
Reverse proxy HTTPS
  |
  |-- Next.js container
  |-- PostgreSQL
  |-- Object Storage para anexos e PDFs
  |-- Backup diario externo
```

Redis nao sera dependencia obrigatoria no MVP. Pode ser adicionado futuramente
para cache, rate limiting, filas, sessoes distribuidas ou notificacoes.

## 4. Multi-tenancy

A entidade central de tenant e `Colegio`.

Quase todas as entidades operacionais devem possuir `colegioId`. A excecao sao
catalogos globais, usuarios globais e tabelas de relacionamento que derivam o
colegio por relacao direta.

Um usuario nao deve ter apenas um `colegioId` direto, porque:

- administradores podem atuar em varios colegios;
- responsaveis podem ter alunos em mais de um colegio;
- funcionarios ou militares podem mudar de unidade;
- RBAC precisa ser contextual por colegio.

Por isso, a base da autorizacao sera:

```text
Usuario
  |
  | 1:N
  v
UsuarioColegio
  |
  | N:N
  v
Perfil
  |
  | N:N
  v
Permissao
```

Toda acao sensivel deve validar:

```text
usuario autenticado
+ colegio ativo no contexto
+ vinculo UsuarioColegio ativo
+ perfil no colegio
+ permissao requerida
```

Nunca confiar em `colegioId`, `userId` ou `role` vindos diretamente do cliente.

A troca de colegio ativo deve ser feita apenas por acao autenticada no servidor.
O usuario so pode alternar para outro CPM se tiver vinculo ativo naquele colegio
e se esse vinculo possuir um perfil com a permissao `tenancy.switch`.

Na fundacao, esta permissao fica restrita aos perfis:

- ADMINISTRADOR
- DIRETOR_PM
- DIRETOR_ADJUNTO
- CHEFE_CORPO_ALUNOS

## 5. Autenticacao

Modelo inicial:

- login por CPF ou username;
- senha com hash seguro;
- sessao HTTP segura;
- expiracao de sessao;
- protecao contra enumeracao de usuarios;
- middleware para rotas protegidas;
- login sempre como primeira tela publica;
- sem cadastro publico.

O aluno menor nao tera login proprio no MVP.

O responsavel tera login proprio como `Usuario`, com dados complementares em
`Responsavel`.

## 6. RBAC

Perfis iniciais:

- ADMINISTRADOR
- DIRETOR_PM
- DIRETOR_ADJUNTO
- CHEFE_CORPO_ALUNOS
- COMANDANTE_COMPANHIA
- COMANDANTE_PELOTAO
- PROFESSOR
- FUNCIONARIO
- MILITAR
- RESPONSAVEL

Permissoes devem ser atomicas e semanticas, por exemplo:

```text
colegios.manage
usuarios.manage
rbac.manage
alunos.read
alunos.manage
alunos.transfer
turmas.manage
auditoria.read
tenancy.switch
auth.login
```

Permissoes disciplinares serao adicionadas apenas na fase do modulo disciplinar,
por exemplo:

```text
ocorrencias.create
ocorrencias.read.own
ocorrencias.read.school
manifestacoes.create
ciencias.confirm
enquadramentos.manage
sancoes.apply
reconsideracoes.decide
```

Na fundacao, a permissao `alunos.transfer` representa transferencia cadastral
entre CPMs. Ela nao e uma permissao disciplinar e deve ficar limitada a:

- ADMINISTRADOR
- DIRETOR_PM
- DIRETOR_ADJUNTO
- CHEFE_CORPO_ALUNOS

`DIRETOR_PM` e `DIRETOR_ADJUNTO` podem gerenciar usuarios, alunos,
responsaveis e turmas somente dentro do CPM ativo. Eles nao devem ter a
permissao `colegios.manage`, nao devem acessar a aba de colegios e nao podem
visualizar, criar, editar, inativar ou atribuir o perfil `ADMINISTRADOR`.

Alteracoes de perfis de usuarios devem sempre registrar auditoria com o usuario
que executou a alteracao, preservando rastreabilidade para mudancas futuras de
Diretor PM ou Diretor-adjunto.

Na fundacao, o objetivo e provar que uma rota protegida consegue diferenciar:

- usuario nao autenticado;
- usuario autenticado sem colegio ativo;
- usuario autenticado sem permissao;
- usuario autorizado.

## 7. Auditoria

Auditoria basica deve existir desde a fundacao.

Campos minimos:

```text
id
usuarioId
colegioId
acao
entidade
entidadeId
dadosAnteriores
dadosNovos
ip
userAgent
dataHora
```

Eventos iniciais:

```text
LOGIN_SUCESSO
LOGIN_FALHA
LOGOUT
CRIACAO_USUARIO
ALTERACAO_USUARIO
ALTERACAO_PERFIL_USUARIO
ACESSO_NEGADO
TROCA_COLEGIO_ATIVO
TROCA_COLEGIO_NEGADA
TRANSFERENCIA_ALUNO_CPM
```

Eventos disciplinares serao acrescentados na fase propria.

## 8. Modelo ER proposto

### 8.1 Fundacao

```text
Colegio 1:N UsuarioColegio N:1 Usuario
UsuarioColegio 1:N UsuarioColegioPerfil N:1 Perfil
Perfil 1:N PerfilPermissao N:1 Permissao
Usuario 1:N Sessao
Usuario 1:N Auditoria
Colegio 1:N Auditoria
```

### 8.2 Cadastros-base

```text
Aluno representa a identidade continua do estudante entre CPMs.
Colegio 1:N AlunoVinculoColegio N:1 Aluno
Usuario 1:0..1 Responsavel
Aluno 1:N AlunoResponsavel N:1 Responsavel
Colegio 1:N AnoLetivo
AnoLetivo 1:N Turma
Turma 1:N Matricula
Aluno 1:N Matricula
AlunoVinculoColegio 1:N Matricula
```

### 8.2.1 Transferencia entre CPMs

O aluno deve poder migrar entre Colegios da Policia Militar sem perder sua
identidade administrativa e sem fragmentar o historico disciplinar.

Decisao de modelagem:

- `Aluno` e uma identidade global do estudante;
- `Aluno.matriculaGeral` e unica quando informada;
- `AlunoVinculoColegio` registra a relacao do aluno com cada CPM;
- `Matricula` aponta para o vinculo do aluno naquele CPM e naquele ano letivo;
- futura ocorrencia disciplinar deve referenciar o mesmo `alunoId`, registrando
  tambem o colegio de origem do fato;
- o CPM de destino podera consultar o historico do aluno porque passa a ter
  vinculo formal com aquele `alunoId`;
- o responsavel permanece vinculado ao mesmo aluno e devera receber ou manter
  vinculo de usuario com o novo CPM no processo de transferencia;
- a transferencia de aluno so pode ser iniciada pelo CPM de origem;
- a matricula geral do aluno e preservada;
- a matricula ativa da origem deve ser inativada, e o destino cria ou atualiza
  matricula quando turma de destino estiver definida;
- responsaveis recebem vinculo ativo no CPM de destino com perfil
  `RESPONSAVEL`;
- o vinculo do responsavel no CPM de origem deve ser desativado quando nao
  houver outro aluno ativo dele naquele CPM;
- acesso cruzado indevido continua bloqueado: um CPM sem vinculo formal com o
  aluno nao deve consultar seu historico.

Estados iniciais do vinculo:

```text
ATIVO
TRANSFERIDO
ENCERRADO
```

Esta decisao preserva a regra de multi-tenancy sem duplicar o aluno a cada
transferencia.

### 8.3 Modulo disciplinar futuro

```text
Colegio 1:N Ocorrencia
Usuario 1:N Ocorrencia como comunicante
Ocorrencia 1:N OcorrenciaAluno
Aluno 1:N OcorrenciaAluno

OcorrenciaAluno 1:N Manifestacao
OcorrenciaAluno 1:N Ciencia
OcorrenciaAluno 1:N EnquadramentoDisciplinar
Transgressao 1:N EnquadramentoDisciplinar

OcorrenciaAluno 1:N Decisao
Decisao 1:N Sancao
TipoSancao 1:N Sancao
Sancao 1:N ModificacaoSancao
Sancao 1:N Reconsideracao

Aluno 1:N MovimentoPontuacao
Matricula 1:N MovimentoPontuacao
Elogio 1:N MovimentoPontuacao
Sancao 1:N MovimentoPontuacao

OcorrenciaAluno 1:N AfastamentoCautelar
OcorrenciaAluno 1:N Sindicancia
Sindicancia 1:N ConselhoDisciplinar
```

## 9. Schema Prisma proposto

Este schema e uma proposta inicial. A primeira migration deve conter apenas a
fundacao. Os blocos disciplinares ficam planejados, mas nao devem ser criados
antes da fase correta.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Colegio {
  id        String   @id @default(uuid()) @db.Uuid
  nome      String
  codigo    String   @unique
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuarios   UsuarioColegio[]
  alunos     Aluno[]
  anosLetivos AnoLetivo[]
  turmas     Turma[]
  auditorias Auditoria[]

  @@map("colegios")
}

model Usuario {
  id           String    @id @default(uuid()) @db.Uuid
  nome         String
  cpf          String?   @unique
  username     String?   @unique
  email        String?   @unique
  passwordHash String
  ativo        Boolean   @default(true)
  ultimoLogin  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  colegios    UsuarioColegio[]
  responsavel Responsavel?
  auditorias  Auditoria[]

  @@map("usuarios")
}

model UsuarioColegio {
  id        String   @id @default(uuid()) @db.Uuid
  usuarioId String   @db.Uuid
  colegioId String   @db.Uuid
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuario Usuario @relation(fields: [usuarioId], references: [id])
  colegio Colegio @relation(fields: [colegioId], references: [id])
  perfis  UsuarioColegioPerfil[]

  @@unique([usuarioId, colegioId])
  @@index([colegioId, ativo])
  @@map("usuario_colegios")
}

model Perfil {
  id        Int      @id @default(autoincrement())
  codigo    String   @unique
  nome      String
  descricao String?
  sistema   Boolean  @default(true)
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuarios   UsuarioColegioPerfil[]
  permissoes PerfilPermissao[]

  @@map("perfis")
}

model Permissao {
  id        Int      @id @default(autoincrement())
  codigo    String   @unique
  nome      String
  descricao String?
  createdAt DateTime @default(now())

  perfis PerfilPermissao[]

  @@map("permissoes")
}

model UsuarioColegioPerfil {
  usuarioColegioId String @db.Uuid
  perfilId         Int
  createdAt        DateTime @default(now())

  usuarioColegio UsuarioColegio @relation(fields: [usuarioColegioId], references: [id])
  perfil         Perfil         @relation(fields: [perfilId], references: [id])

  @@id([usuarioColegioId, perfilId])
  @@map("usuario_colegio_perfis")
}

model PerfilPermissao {
  perfilId    Int
  permissaoId Int
  createdAt   DateTime @default(now())

  perfil    Perfil    @relation(fields: [perfilId], references: [id])
  permissao Permissao @relation(fields: [permissaoId], references: [id])

  @@id([perfilId, permissaoId])
  @@map("perfil_permissoes")
}

model Responsavel {
  id        String   @id @default(uuid()) @db.Uuid
  usuarioId String   @unique @db.Uuid
  telefone  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  usuario Usuario @relation(fields: [usuarioId], references: [id])
  alunos  AlunoResponsavel[]

  @@map("responsaveis")
}

model Aluno {
  id             String   @id @default(uuid()) @db.Uuid
  nome           String
  matriculaGeral String?  @unique
  ativo          Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  responsaveis    AlunoResponsavel[]
  matriculas      Matricula[]
  vinculosColegio AlunoVinculoColegio[]

  @@index([ativo])
  @@map("alunos")
}

model AlunoVinculoColegio {
  id          String             @id @default(uuid()) @db.Uuid
  alunoId     String             @db.Uuid
  colegioId   String             @db.Uuid
  status      StatusVinculoAluno @default(ATIVO)
  dataEntrada DateTime?
  dataSaida   DateTime?
  motivoSaida String?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  aluno      Aluno       @relation(fields: [alunoId], references: [id])
  colegio    Colegio     @relation(fields: [colegioId], references: [id])
  matriculas Matricula[]

  @@unique([alunoId, colegioId])
  @@unique([id, alunoId, colegioId])
  @@index([colegioId, status])
  @@index([alunoId, status])
  @@map("aluno_vinculos_colegio")
}

model AlunoResponsavel {
  alunoId       String @db.Uuid
  responsavelId String @db.Uuid
  parentesco    String?
  principal     Boolean @default(false)
  createdAt     DateTime @default(now())

  aluno       Aluno       @relation(fields: [alunoId], references: [id])
  responsavel Responsavel @relation(fields: [responsavelId], references: [id])

  @@id([alunoId, responsavelId])
  @@map("aluno_responsaveis")
}

model AnoLetivo {
  id        String   @id @default(uuid()) @db.Uuid
  colegioId String   @db.Uuid
  ano       Int
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  colegio    Colegio @relation(fields: [colegioId], references: [id])
  turmas     Turma[]
  matriculas Matricula[]

  @@unique([colegioId, ano])
  @@unique([id, colegioId])
  @@map("anos_letivos")
}

model Turma {
  id          String   @id @default(uuid()) @db.Uuid
  colegioId   String   @db.Uuid
  anoLetivoId String   @db.Uuid
  nome        String
  turno       String?
  ativa       Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  colegio    Colegio   @relation(fields: [colegioId], references: [id])
  anoLetivo  AnoLetivo @relation(fields: [anoLetivoId], references: [id])
  matriculas Matricula[]

  @@unique([colegioId, anoLetivoId, nome])
  @@unique([id, colegioId, anoLetivoId])
  @@index([colegioId, ativa])
  @@map("turmas")
}

model Matricula {
  id                    String   @id @default(uuid()) @db.Uuid
  alunoId               String   @db.Uuid
  colegioId             String   @db.Uuid
  alunoVinculoColegioId String   @db.Uuid
  turmaId               String   @db.Uuid
  anoLetivoId           String   @db.Uuid
  numero                String?
  ativa                 Boolean  @default(true)
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  aluno               Aluno               @relation(fields: [alunoId], references: [id])
  colegio             Colegio             @relation(fields: [colegioId], references: [id])
  alunoVinculoColegio AlunoVinculoColegio @relation(fields: [alunoVinculoColegioId, alunoId, colegioId], references: [id, alunoId, colegioId])
  turma               Turma               @relation(fields: [turmaId, colegioId, anoLetivoId], references: [id, colegioId, anoLetivoId])
  anoLetivo           AnoLetivo           @relation(fields: [anoLetivoId, colegioId], references: [id, colegioId])

  @@unique([alunoId, colegioId, anoLetivoId])
  @@index([colegioId, ativa])
  @@index([turmaId, anoLetivoId])
  @@map("matriculas")
}

enum StatusVinculoAluno {
  ATIVO
  TRANSFERIDO
  ENCERRADO
}

model Auditoria {
  id              String   @id @default(uuid()) @db.Uuid
  usuarioId       String?  @db.Uuid
  colegioId       String?  @db.Uuid
  acao            String
  entidade        String?
  entidadeId      String?
  dadosAnteriores Json?
  dadosNovos      Json?
  ip              String?
  userAgent       String?
  dataHora        DateTime @default(now())

  usuario Usuario? @relation(fields: [usuarioId], references: [id])
  colegio Colegio? @relation(fields: [colegioId], references: [id])

  @@index([colegioId, dataHora])
  @@index([usuarioId, dataHora])
  @@index([acao, dataHora])
  @@map("auditoria")
}
```

## 10. Schema disciplinar futuro

As entidades abaixo devem ser implementadas depois da fundacao.

```text
transgressoes
atenuantes
agravantes
ocorrencias
ocorrencia_alunos
enquadramentos_disciplinares
manifestacoes
ciencias
decisoes
tipos_sancao
sancoes
modificacoes_sancao
tipos_elogio
elogios
movimentos_pontuacao
faixas_comportamento
reconsideracoes
afastamentos_cautelares
sindicancias
conselhos_disciplinares
anexos
```

Regras disciplinares que devem virar servicos de dominio:

- uma comunicacao registra fato, nao sancao;
- comunicacao coletiva gera processos individuais por aluno;
- manifestacao nao deve ser sobrescrita;
- ciencia exige acao formal;
- justificativa acolhida nao gera sancao;
- competencia da autoridade deve ser validada no backend;
- pontuacao inicial e 8.00;
- saldo exibido deve ficar entre 0.00 e 10.00;
- restauracao de pontos apos 1 ano deve ser movimento compensatorio;
- reconsideracao pendente suspende efeitos;
- transferencia compulsoria exige processo proprio;
- afastamento cautelar nao e sancao.

## 11. Estrutura de pastas

```text
cpm-disciplinar/
  docs/
    ARQUITETURA_TECNICA.md
  prisma/
    schema.prisma
    seed.ts
    migrations/
  docker/
  src/
    app/
      (auth)/
        login/
      (dashboard)/
      api/
      layout.tsx
      page.tsx
    components/
      ui/
      layout/
      forms/
    db/
      prisma.ts
    lib/
      auth/
      rbac/
      tenancy/
      security/
      validators/
    modules/
      auth/
        actions/
        services/
        schemas/
        types/
      tenancy/
        services/
        types/
      rbac/
        services/
        policies/
        types/
      auditoria/
        services/
        repositories/
        types/
      colegios/
        actions/
        services/
        repositories/
        schemas/
        types/
      usuarios/
        actions/
        services/
        repositories/
        schemas/
        types/
      alunos/
      responsaveis/
      turmas/
    server/
      middleware/
      actions/
    tests/
      unit/
      integration/
```

Evitar criar camadas globais duplicadas quando o modulo ja possuir seu proprio
servico ou repository. A pasta `lib` deve conter infraestrutura compartilhada,
nao regra de dominio.

## 12. Rotas iniciais

Publicas:

```text
/login
```

Protegidas:

```text
/
/dashboard
/colegios
/usuarios
/alunos
/responsaveis
/turmas
```

A rota `/` deve redirecionar:

- nao autenticado para `/login`;
- autenticado para `/dashboard`.

Nenhum dashboard ou dado interno deve aparecer antes da autenticacao.

## 12.1 CRUD cadastral da fundacao

O CRUD dos cadastros-base deve seguir estas regras:

- `Create`: cria registros administrativos com auditoria;
- `Read`: consulta sempre filtrada por tenant quando a entidade for contextual;
- `Update`: altera dados cadastrais por Server Action autenticada e auditada;
- `Delete`: representado por inativacao, encerramento de vinculo ou
  transferencia, sem exclusao fisica silenciosa.

Exclusao fisica so deve ser considerada futuramente para registros claramente
temporarios, sem vinculo historico e com regra explicita aprovada.

## 13. Testes da fundacao

Testes prioritarios da primeira etapa:

- login com credenciais validas;
- falha de login sem revelar se usuario existe;
- usuario sem sessao nao acessa rota protegida;
- usuario sem vinculo ativo ao colegio nao acessa dados do colegio;
- usuario sem permissao recebe bloqueio;
- usuario com permissao acessa rota permitida;
- tenant nao pode ser trocado por parametro de cliente;
- auditoria registra login e acesso negado;
- seed cria perfis e permissoes iniciais.

Testes disciplinares so devem ser criados quando o modulo disciplinar iniciar.

## 14. Plano de commits incrementais

1. `docs: add technical architecture`
2. `chore: scaffold next app with typescript and tailwind`
3. `chore: add eslint prettier and base scripts`
4. `chore: add docker compose for app and postgres`
5. `chore: configure prisma and env examples`
6. `feat: add modular project structure`
7. `feat: add foundation database schema`
8. `feat: seed roles permissions and first colegio`
9. `feat: implement credential authentication`
10. `feat: add tenant context and protected routes`
11. `feat: implement rbac guards`
12. `feat: add basic audit logging`
13. `test: cover auth tenant rbac and audit foundation`
14. `docs: add setup and operational notes`

## 15. Duvidas que impedem implementacao

Nao ha duvida funcional que impeca a fundacao tecnica.

Assuncoes tecnicas para iniciar:

- projeto sera criado em `cpm-disciplinar`;
- autenticacao inicial sera por credenciais internas;
- PostgreSQL local sera via Docker;
- RBAC sera proprio, baseado em perfis e permissoes;
- usuario pode estar vinculado a mais de um colegio;
- primeiro seed criara ao menos um colegio e um usuario administrador.

Duvidas que nao bloqueiam a fundacao, mas devem ser confirmadas antes dos
modulos disciplinares ou antes de producao:

- numeracao oficial das comunicacoes;
- numeracao e publicacao de sancoes;
- texto oficial de ciencia;
- formato oficial da FAD;
- prazo interno de respostas que nao sejam falta ou atraso;
- fluxo detalhado de sindicancia;
- fluxo detalhado do Conselho Disciplinar;
- politica de retencao de documentos;
- modelo de boletim interno;
- integracoes futuras.

## 16. Criterio de pronto da fundacao

A fundacao sera considerada pronta quando for possivel:

- subir o projeto via Docker;
- acessar a tela de login;
- autenticar usuario;
- identificar colegio ativo;
- identificar perfis e permissoes;
- bloquear rota sem permissao;
- acessar PostgreSQL via Prisma;
- registrar auditoria basica;
- executar testes da fundacao.

Nenhuma funcionalidade disciplinar deve ser implementada antes disso.
