-- AlterTable
ALTER TABLE "ocorrencia_alunos" ADD COLUMN     "ano_numeracao" INTEGER,
ADD COLUMN     "numero_sequencial" INTEGER;

-- CreateTable
CREATE TABLE "sequencias_numeracao" (
    "colegio_id" UUID NOT NULL,
    "escopo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequencias_numeracao_pkey" PRIMARY KEY ("colegio_id","escopo","ano")
);

-- AddForeignKey
ALTER TABLE "sequencias_numeracao" ADD CONSTRAINT "sequencias_numeracao_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

