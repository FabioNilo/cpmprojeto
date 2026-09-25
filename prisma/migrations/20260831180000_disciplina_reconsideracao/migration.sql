-- CreateEnum
CREATE TYPE "StatusReconsideracao" AS ENUM ('PENDENTE', 'DEFERIDA', 'INDEFERIDA', 'ENCERRADA');

-- CreateTable
CREATE TABLE "reconsideracoes" (
    "id" UUID NOT NULL,
    "sancao_id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "solicitante_id" UUID NOT NULL,
    "texto" TEXT NOT NULL,
    "status" "StatusReconsideracao" NOT NULL DEFAULT 'PENDENTE',
    "prazo_final" TIMESTAMP(3) NOT NULL,
    "parecer_decisao" TEXT,
    "decidido_por_id" UUID,
    "decidido_por_perfil_codigo" TEXT,
    "decidida_em" TIMESTAMP(3),
    "novo_tipo_sancao_codigo" TEXT,
    "novos_dias" INTEGER,
    "numero" TEXT,
    "sequencial" INTEGER,
    "ano_numeracao" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconsideracoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reconsideracoes_ocorrencia_aluno_id_idx" ON "reconsideracoes"("ocorrencia_aluno_id");

-- CreateIndex
CREATE INDEX "reconsideracoes_sancao_id_status_idx" ON "reconsideracoes"("sancao_id", "status");

-- AddForeignKey
ALTER TABLE "reconsideracoes" ADD CONSTRAINT "reconsideracoes_sancao_id_fkey" FOREIGN KEY ("sancao_id") REFERENCES "sancoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconsideracoes" ADD CONSTRAINT "reconsideracoes_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconsideracoes" ADD CONSTRAINT "reconsideracoes_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconsideracoes" ADD CONSTRAINT "reconsideracoes_decidido_por_id_fkey" FOREIGN KEY ("decidido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

