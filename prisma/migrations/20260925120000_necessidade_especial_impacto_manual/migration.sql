-- AlterTable
ALTER TABLE "alunos" ADD COLUMN     "necessidade_especial" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sancoes" ADD COLUMN     "impacto_manual" BOOLEAN NOT NULL DEFAULT false;
