-- CreateEnum
CREATE TYPE "StatusSancao" AS ENUM ('ATIVA', 'SUSPENSA', 'ANULADA', 'CUMPRIDA');

-- CreateEnum
CREATE TYPE "TipoModificacaoSancao" AS ENUM ('ANULACAO', 'SUSPENSAO_EFEITOS', 'RETOMADA_EFEITOS', 'CUMPRIMENTO');

-- CreateEnum
CREATE TYPE "TipoMovimentoPontuacao" AS ENUM ('SANCAO', 'ELOGIO', 'RESTAURACAO_SANCAO', 'BONIFICACAO_ANUAL', 'AJUSTE_ADMINISTRATIVO');

-- CreateTable
CREATE TABLE "sancoes" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "decisao_id" UUID NOT NULL,
    "tipo_sancao_codigo" TEXT NOT NULL,
    "dias" INTEGER,
    "impacto_pontos" DECIMAL(4,2) NOT NULL,
    "status" "StatusSancao" NOT NULL DEFAULT 'ATIVA',
    "numero_publicacao" TEXT,
    "sequencial" INTEGER,
    "ano_numeracao" INTEGER,
    "observacao" TEXT,
    "aplicada_por_id" UUID NOT NULL,
    "aplicada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cumprida_em" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sancoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modificacoes_sancao" (
    "id" UUID NOT NULL,
    "sancao_id" UUID NOT NULL,
    "tipo" "TipoModificacaoSancao" NOT NULL,
    "motivo" TEXT NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modificacoes_sancao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_pontuacao" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "tipo" "TipoMovimentoPontuacao" NOT NULL,
    "valor" DECIMAL(5,2) NOT NULL,
    "origem_tipo" TEXT,
    "origem_id" TEXT,
    "descricao" TEXT NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "efetivado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pontuacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elogios" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "tipo_elogio_codigo" TEXT NOT NULL,
    "valor_pontos" DECIMAL(4,2) NOT NULL,
    "descricao" TEXT NOT NULL,
    "registrado_por_id" UUID NOT NULL,
    "concedido_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elogios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sancoes_ocorrencia_aluno_id_idx" ON "sancoes"("ocorrencia_aluno_id");

-- CreateIndex
CREATE INDEX "sancoes_decisao_id_idx" ON "sancoes"("decisao_id");

-- CreateIndex
CREATE INDEX "modificacoes_sancao_sancao_id_created_at_idx" ON "modificacoes_sancao"("sancao_id", "created_at");

-- CreateIndex
CREATE INDEX "movimentos_pontuacao_aluno_id_colegio_id_efetivado_em_idx" ON "movimentos_pontuacao"("aluno_id", "colegio_id", "efetivado_em");

-- CreateIndex
CREATE INDEX "movimentos_pontuacao_origem_tipo_origem_id_idx" ON "movimentos_pontuacao"("origem_tipo", "origem_id");

-- CreateIndex
CREATE INDEX "elogios_aluno_id_colegio_id_concedido_em_idx" ON "elogios"("aluno_id", "colegio_id", "concedido_em");

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_decisao_id_fkey" FOREIGN KEY ("decisao_id") REFERENCES "decisoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_aplicada_por_id_fkey" FOREIGN KEY ("aplicada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificacoes_sancao" ADD CONSTRAINT "modificacoes_sancao_sancao_id_fkey" FOREIGN KEY ("sancao_id") REFERENCES "sancoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificacoes_sancao" ADD CONSTRAINT "modificacoes_sancao_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontuacao" ADD CONSTRAINT "movimentos_pontuacao_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontuacao" ADD CONSTRAINT "movimentos_pontuacao_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontuacao" ADD CONSTRAINT "movimentos_pontuacao_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elogios" ADD CONSTRAINT "elogios_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elogios" ADD CONSTRAINT "elogios_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elogios" ADD CONSTRAINT "elogios_tipo_elogio_codigo_fkey" FOREIGN KEY ("tipo_elogio_codigo") REFERENCES "tipos_elogio"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elogios" ADD CONSTRAINT "elogios_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

