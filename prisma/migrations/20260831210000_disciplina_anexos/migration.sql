-- CreateEnum
CREATE TYPE "CategoriaAnexo" AS ENUM ('COMUNICACAO', 'MANIFESTACAO', 'DECISAO', 'SANCAO', 'RECONSIDERACAO', 'SINDICANCIA', 'CONSELHO', 'FAD', 'OUTRO');

-- CreateEnum
CREATE TYPE "OrigemAnexo" AS ENUM ('UPLOAD', 'GERADO');

-- CreateTable
CREATE TABLE "anexos" (
    "id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "ocorrencia_id" UUID,
    "ocorrencia_aluno_id" UUID,
    "manifestacao_id" UUID,
    "categoria" "CategoriaAnexo" NOT NULL DEFAULT 'OUTRO',
    "origem" "OrigemAnexo" NOT NULL DEFAULT 'UPLOAD',
    "nome_arquivo" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "hash" TEXT,
    "removido_em" TIMESTAMP(3),
    "enviado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anexos_storage_path_key" ON "anexos"("storage_path");

-- CreateIndex
CREATE INDEX "anexos_colegio_id_created_at_idx" ON "anexos"("colegio_id", "created_at");

-- CreateIndex
CREATE INDEX "anexos_ocorrencia_id_idx" ON "anexos"("ocorrencia_id");

-- CreateIndex
CREATE INDEX "anexos_ocorrencia_aluno_id_idx" ON "anexos"("ocorrencia_aluno_id");

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_manifestacao_id_fkey" FOREIGN KEY ("manifestacao_id") REFERENCES "manifestacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

