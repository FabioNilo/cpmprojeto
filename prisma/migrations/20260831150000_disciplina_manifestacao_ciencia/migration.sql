-- CreateEnum
CREATE TYPE "TipoManifestacao" AS ENUM ('JUSTIFICACAO', 'DEFESA', 'ESCLARECIMENTO', 'COMPLEMENTACAO');

-- CreateEnum
CREATE TYPE "AlvoCiencia" AS ENUM ('OCORRENCIA', 'DECISAO');

-- CreateEnum
CREATE TYPE "MeioCiencia" AS ENUM ('PORTAL', 'PRESENCIAL', 'TELEFONE', 'RECUSA');

-- AlterTable
ALTER TABLE "ocorrencia_alunos" ADD COLUMN     "avaliado_em" TIMESTAMP(3),
ADD COLUMN     "avaliado_por_id" UUID,
ADD COLUMN     "manifestacao_acolhida" BOOLEAN,
ADD COLUMN     "parecer_manifestacao" TEXT;

-- CreateTable
CREATE TABLE "manifestacoes" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "tipo" "TipoManifestacao" NOT NULL DEFAULT 'JUSTIFICACAO',
    "texto" TEXT NOT NULL,
    "via_presencial" BOOLEAN NOT NULL DEFAULT false,
    "autor_id" UUID NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manifestacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ciencias" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "sobre" "AlvoCiencia" NOT NULL DEFAULT 'OCORRENCIA',
    "meio" "MeioCiencia" NOT NULL DEFAULT 'PORTAL',
    "observacao" TEXT,
    "confirmada_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ciencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manifestacoes_ocorrencia_aluno_id_created_at_idx" ON "manifestacoes"("ocorrencia_aluno_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ciencias_ocorrencia_aluno_id_sobre_key" ON "ciencias"("ocorrencia_aluno_id", "sobre");

-- AddForeignKey
ALTER TABLE "ocorrencia_alunos" ADD CONSTRAINT "ocorrencia_alunos_avaliado_por_id_fkey" FOREIGN KEY ("avaliado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestacoes" ADD CONSTRAINT "manifestacoes_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestacoes" ADD CONSTRAINT "manifestacoes_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manifestacoes" ADD CONSTRAINT "manifestacoes_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciencias" ADD CONSTRAINT "ciencias_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ciencias" ADD CONSTRAINT "ciencias_confirmada_por_id_fkey" FOREIGN KEY ("confirmada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
