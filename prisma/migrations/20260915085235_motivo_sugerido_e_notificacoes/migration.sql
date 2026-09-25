-- CreateEnum
CREATE TYPE "TipoNotificacaoResponsavel" AS ENUM ('COMUNICACAO_DISCIPLINAR', 'AVISO_ESCOLA');

-- AlterTable
ALTER TABLE "ocorrencias" ADD COLUMN     "motivo_sugerido_id" UUID;

-- CreateTable
CREATE TABLE "notificacoes_responsavel" (
    "id" UUID NOT NULL,
    "responsavel_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "tipo" "TipoNotificacaoResponsavel" NOT NULL,
    "ocorrencia_aluno_id" UUID,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "criado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lido_em" TIMESTAMP(3),

    CONSTRAINT "notificacoes_responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_responsavel_responsavel_id_lido_em_idx" ON "notificacoes_responsavel"("responsavel_id", "lido_em");

-- CreateIndex
CREATE INDEX "notificacoes_responsavel_colegio_id_criado_em_idx" ON "notificacoes_responsavel"("colegio_id", "criado_em");

-- CreateIndex
CREATE INDEX "ocorrencias_motivo_sugerido_id_idx" ON "ocorrencias"("motivo_sugerido_id");

-- AddForeignKey
ALTER TABLE "ocorrencias" ADD CONSTRAINT "ocorrencias_motivo_sugerido_id_fkey" FOREIGN KEY ("motivo_sugerido_id") REFERENCES "transgressoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_responsavel" ADD CONSTRAINT "notificacoes_responsavel_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "responsaveis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_responsavel" ADD CONSTRAINT "notificacoes_responsavel_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_responsavel" ADD CONSTRAINT "notificacoes_responsavel_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes_responsavel" ADD CONSTRAINT "notificacoes_responsavel_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
