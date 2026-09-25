-- CreateEnum
CREATE TYPE "ResultadoDecisao" AS ENUM ('PROCEDENTE', 'IMPROCEDENTE', 'ARQUIVADO', 'ENCAMINHADO_SINDICANCIA');

-- CreateTable
CREATE TABLE "enquadramentos_disciplinares" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "transgressao_id" UUID NOT NULL,
    "natureza" "NaturezaTransgressao" NOT NULL,
    "fundamentacao" TEXT,
    "registrado_por_id" UUID NOT NULL,
    "revogado_em" TIMESTAMP(3),
    "revogado_por_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquadramentos_disciplinares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisoes" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "resultado" "ResultadoDecisao" NOT NULL,
    "natureza_apurada" "NaturezaTransgressao",
    "sancao_tipo_codigo" TEXT,
    "dias_sancao" INTEGER,
    "fundamentacao" TEXT NOT NULL,
    "decidido_por_id" UUID NOT NULL,
    "decidido_por_perfil_codigo" TEXT NOT NULL,
    "numero" TEXT,
    "sequencial" INTEGER,
    "ano_numeracao" INTEGER,
    "revogado_em" TIMESTAMP(3),
    "revogado_por_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decisao_atenuantes" (
    "decisao_id" UUID NOT NULL,
    "atenuante_id" UUID NOT NULL,

    CONSTRAINT "decisao_atenuantes_pkey" PRIMARY KEY ("decisao_id","atenuante_id")
);

-- CreateTable
CREATE TABLE "decisao_agravantes" (
    "decisao_id" UUID NOT NULL,
    "agravante_id" UUID NOT NULL,

    CONSTRAINT "decisao_agravantes_pkey" PRIMARY KEY ("decisao_id","agravante_id")
);

-- CreateIndex
CREATE INDEX "enquadramentos_disciplinares_ocorrencia_aluno_id_revogado_e_idx" ON "enquadramentos_disciplinares"("ocorrencia_aluno_id", "revogado_em");

-- CreateIndex
CREATE INDEX "decisoes_ocorrencia_aluno_id_revogado_em_idx" ON "decisoes"("ocorrencia_aluno_id", "revogado_em");

-- CreateIndex
CREATE UNIQUE INDEX "decisoes_ocorrencia_aluno_id_ano_numeracao_sequencial_key" ON "decisoes"("ocorrencia_aluno_id", "ano_numeracao", "sequencial");

-- AddForeignKey
ALTER TABLE "enquadramentos_disciplinares" ADD CONSTRAINT "enquadramentos_disciplinares_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquadramentos_disciplinares" ADD CONSTRAINT "enquadramentos_disciplinares_transgressao_id_fkey" FOREIGN KEY ("transgressao_id") REFERENCES "transgressoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquadramentos_disciplinares" ADD CONSTRAINT "enquadramentos_disciplinares_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquadramentos_disciplinares" ADD CONSTRAINT "enquadramentos_disciplinares_revogado_por_id_fkey" FOREIGN KEY ("revogado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisoes" ADD CONSTRAINT "decisoes_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisoes" ADD CONSTRAINT "decisoes_decidido_por_id_fkey" FOREIGN KEY ("decidido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisoes" ADD CONSTRAINT "decisoes_revogado_por_id_fkey" FOREIGN KEY ("revogado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisao_atenuantes" ADD CONSTRAINT "decisao_atenuantes_decisao_id_fkey" FOREIGN KEY ("decisao_id") REFERENCES "decisoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisao_atenuantes" ADD CONSTRAINT "decisao_atenuantes_atenuante_id_fkey" FOREIGN KEY ("atenuante_id") REFERENCES "atenuantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisao_agravantes" ADD CONSTRAINT "decisao_agravantes_decisao_id_fkey" FOREIGN KEY ("decisao_id") REFERENCES "decisoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decisao_agravantes" ADD CONSTRAINT "decisao_agravantes_agravante_id_fkey" FOREIGN KEY ("agravante_id") REFERENCES "agravantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

