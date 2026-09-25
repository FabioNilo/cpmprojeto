-- CreateEnum
CREATE TYPE "TipoOcorrencia" AS ENUM ('DISCIPLINAR', 'FALTA_ESCOLAR', 'ATRASO_ESCOLAR');

-- CreateEnum
CREATE TYPE "StatusOcorrencia" AS ENUM ('RASCUNHO', 'ENVIADA', 'EM_AVERIGUACAO', 'AGUARDANDO_MANIFESTACAO', 'AGUARDANDO_CIENCIA', 'EM_ANALISE', 'DECIDIDA', 'ENCERRADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "StatusProcessoAluno" AS ENUM ('PENDENTE', 'JUSTIFICADO', 'PROCEDENTE', 'IMPROCEDENTE', 'ARQUIVADO');

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "comunicante_id" UUID NOT NULL,
    "tipo" "TipoOcorrencia" NOT NULL DEFAULT 'DISCIPLINAR',
    "status" "StatusOcorrencia" NOT NULL DEFAULT 'RASCUNHO',
    "numero" TEXT,
    "sequencial" INTEGER,
    "ano_numeracao" INTEGER,
    "data_ocorrencia" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "descricao" TEXT NOT NULL,
    "sigiloso" BOOLEAN NOT NULL DEFAULT false,
    "enviada_em" TIMESTAMP(3),
    "encerrada_em" TIMESTAMP(3),
    "motivo_arquivamento" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencia_alunos" (
    "id" UUID NOT NULL,
    "ocorrencia_id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "ordem" INTEGER NOT NULL,
    "numero_processo" TEXT,
    "status" "StatusProcessoAluno" NOT NULL DEFAULT 'PENDENTE',
    "resumo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencia_alunos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ocorrencias_colegio_id_status_idx" ON "ocorrencias"("colegio_id", "status");

-- CreateIndex
CREATE INDEX "ocorrencias_comunicante_id_idx" ON "ocorrencias"("comunicante_id");

-- CreateIndex
CREATE UNIQUE INDEX "ocorrencias_colegio_id_ano_numeracao_sequencial_key" ON "ocorrencias"("colegio_id", "ano_numeracao", "sequencial");

-- CreateIndex
CREATE INDEX "ocorrencia_alunos_aluno_id_status_idx" ON "ocorrencia_alunos"("aluno_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ocorrencia_alunos_ocorrencia_id_aluno_id_key" ON "ocorrencia_alunos"("ocorrencia_id", "aluno_id");

-- CreateIndex
CREATE UNIQUE INDEX "ocorrencia_alunos_ocorrencia_id_ordem_key" ON "ocorrencia_alunos"("ocorrencia_id", "ordem");

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_comunicante_id_fkey" FOREIGN KEY ("comunicante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_alunos" ADD CONSTRAINT "ocorrencia_alunos_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocorrencia_alunos" ADD CONSTRAINT "ocorrencia_alunos_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
