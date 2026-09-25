-- CreateTable
CREATE TABLE "responsaveis" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "telefone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsaveis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos" (
    "id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aluno_responsaveis" (
    "aluno_id" UUID NOT NULL,
    "responsavel_id" UUID NOT NULL,
    "parentesco" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aluno_responsaveis_pkey" PRIMARY KEY ("aluno_id","responsavel_id")
);

-- CreateTable
CREATE TABLE "anos_letivos" (
    "id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "ano" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anos_letivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "ano_letivo_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "turno" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "turma_id" UUID NOT NULL,
    "ano_letivo_id" UUID NOT NULL,
    "numero" TEXT,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "responsaveis_usuario_id_key" ON "responsaveis"("usuario_id");

-- CreateIndex
CREATE INDEX "alunos_colegio_id_ativo_idx" ON "alunos"("colegio_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_colegio_id_matricula_key" ON "alunos"("colegio_id", "matricula");

-- CreateIndex
CREATE INDEX "aluno_responsaveis_responsavel_id_idx" ON "aluno_responsaveis"("responsavel_id");

-- CreateIndex
CREATE UNIQUE INDEX "anos_letivos_colegio_id_ano_key" ON "anos_letivos"("colegio_id", "ano");

-- CreateIndex
CREATE INDEX "turmas_colegio_id_ativa_idx" ON "turmas"("colegio_id", "ativa");

-- CreateIndex
CREATE INDEX "turmas_ano_letivo_id_idx" ON "turmas"("ano_letivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_colegio_id_ano_letivo_id_nome_key" ON "turmas"("colegio_id", "ano_letivo_id", "nome");

-- CreateIndex
CREATE INDEX "matriculas_turma_id_ano_letivo_id_idx" ON "matriculas"("turma_id", "ano_letivo_id");

-- CreateIndex
CREATE INDEX "matriculas_ano_letivo_id_ativa_idx" ON "matriculas"("ano_letivo_id", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_aluno_id_ano_letivo_id_key" ON "matriculas"("aluno_id", "ano_letivo_id");

-- AddForeignKey
ALTER TABLE "responsaveis" ADD CONSTRAINT "responsaveis_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alunos" ADD CONSTRAINT "alunos_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_responsaveis" ADD CONSTRAINT "aluno_responsaveis_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno_responsaveis" ADD CONSTRAINT "aluno_responsaveis_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anos_letivos" ADD CONSTRAINT "anos_letivos_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_ano_letivo_id_fkey" FOREIGN KEY ("ano_letivo_id") REFERENCES "anos_letivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_ano_letivo_id_fkey" FOREIGN KEY ("ano_letivo_id") REFERENCES "anos_letivos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
