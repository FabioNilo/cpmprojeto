-- AlterTable
ALTER TABLE "elogios" ADD COLUMN     "ano_numeracao" INTEGER,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "sequencial" INTEGER;

-- AlterTable
ALTER TABLE "ocorrencias" ADD COLUMN     "materia" TEXT;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "posto" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "elogios_colegio_id_ano_numeracao_sequencial_key" ON "elogios"("colegio_id", "ano_numeracao", "sequencial");
