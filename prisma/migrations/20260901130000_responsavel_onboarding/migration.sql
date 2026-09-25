-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "mudar_senha_obrigatoria" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termo_responsavel_aceito_em" TIMESTAMP(3),
ADD COLUMN     "termo_responsavel_versao" TEXT;

