-- CreateTable
CREATE TABLE "solicitacoes_senha_responsavel" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atendida_em" TIMESTAMP(3),
    "atendida_por_id" UUID,

    CONSTRAINT "solicitacoes_senha_responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "solicitacoes_senha_responsavel_colegio_id_atendida_em_idx" ON "solicitacoes_senha_responsavel"("colegio_id", "atendida_em");

-- CreateIndex
CREATE INDEX "solicitacoes_senha_responsavel_usuario_id_atendida_em_idx" ON "solicitacoes_senha_responsavel"("usuario_id", "atendida_em");

-- AddForeignKey
ALTER TABLE "solicitacoes_senha_responsavel" ADD CONSTRAINT "solicitacoes_senha_responsavel_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_senha_responsavel" ADD CONSTRAINT "solicitacoes_senha_responsavel_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_senha_responsavel" ADD CONSTRAINT "solicitacoes_senha_responsavel_atendida_por_id_fkey" FOREIGN KEY ("atendida_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

