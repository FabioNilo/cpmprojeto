-- CreateEnum
CREATE TYPE "StatusAfastamento" AS ENUM ('ATIVO', 'PRORROGADO', 'ENCERRADO', 'REVOGADO');

-- CreateEnum
CREATE TYPE "StatusSindicancia" AS ENUM ('INSTAURADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "StatusConselho" AS ENUM ('INSTAURADO', 'EM_SESSAO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "afastamentos_cautelares" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "justificativa" TEXT NOT NULL,
    "dias_iniciais" INTEGER NOT NULL DEFAULT 5,
    "inicio_em" TIMESTAMP(3) NOT NULL,
    "fim_previsto" TIMESTAMP(3) NOT NULL,
    "status" "StatusAfastamento" NOT NULL DEFAULT 'ATIVO',
    "prorrogado_em" TIMESTAMP(3),
    "fim_prorrogado" TIMESTAMP(3),
    "encerrado_em" TIMESTAMP(3),
    "motivo_encerramento" TEXT,
    "determinado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "afastamentos_cautelares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sindicancias" (
    "id" UUID NOT NULL,
    "ocorrencia_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "numero" TEXT,
    "sequencial" INTEGER,
    "ano_numeracao" INTEGER,
    "objeto" TEXT NOT NULL,
    "status" "StatusSindicancia" NOT NULL DEFAULT 'INSTAURADA',
    "conclusao" TEXT,
    "concluida_em" TIMESTAMP(3),
    "sindicante_id" UUID NOT NULL,
    "instaurada_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sindicancias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conselhos_disciplinares" (
    "id" UUID NOT NULL,
    "ocorrencia_aluno_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "numero" TEXT,
    "sequencial" INTEGER,
    "ano_numeracao" INTEGER,
    "objeto" TEXT NOT NULL,
    "status" "StatusConselho" NOT NULL DEFAULT 'INSTAURADO',
    "parecer" TEXT,
    "recomendacao" TEXT,
    "votos_favor" INTEGER,
    "votos_contra" INTEGER,
    "concluido_em" TIMESTAMP(3),
    "presidido_por_id" UUID NOT NULL,
    "instaurado_por_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conselhos_disciplinares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "afastamentos_cautelares_ocorrencia_aluno_id_idx" ON "afastamentos_cautelares"("ocorrencia_aluno_id");

-- CreateIndex
CREATE INDEX "afastamentos_cautelares_colegio_id_status_idx" ON "afastamentos_cautelares"("colegio_id", "status");

-- CreateIndex
CREATE INDEX "sindicancias_ocorrencia_id_idx" ON "sindicancias"("ocorrencia_id");

-- CreateIndex
CREATE INDEX "sindicancias_colegio_id_status_idx" ON "sindicancias"("colegio_id", "status");

-- CreateIndex
CREATE INDEX "conselhos_disciplinares_ocorrencia_aluno_id_idx" ON "conselhos_disciplinares"("ocorrencia_aluno_id");

-- CreateIndex
CREATE INDEX "conselhos_disciplinares_colegio_id_status_idx" ON "conselhos_disciplinares"("colegio_id", "status");

-- AddForeignKey
ALTER TABLE "afastamentos_cautelares" ADD CONSTRAINT "afastamentos_cautelares_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afastamentos_cautelares" ADD CONSTRAINT "afastamentos_cautelares_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "afastamentos_cautelares" ADD CONSTRAINT "afastamentos_cautelares_determinado_por_id_fkey" FOREIGN KEY ("determinado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sindicancias" ADD CONSTRAINT "sindicancias_ocorrencia_id_fkey" FOREIGN KEY ("ocorrencia_id") REFERENCES "ocorrencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sindicancias" ADD CONSTRAINT "sindicancias_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sindicancias" ADD CONSTRAINT "sindicancias_sindicante_id_fkey" FOREIGN KEY ("sindicante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sindicancias" ADD CONSTRAINT "sindicancias_instaurada_por_id_fkey" FOREIGN KEY ("instaurada_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conselhos_disciplinares" ADD CONSTRAINT "conselhos_disciplinares_ocorrencia_aluno_id_fkey" FOREIGN KEY ("ocorrencia_aluno_id") REFERENCES "ocorrencia_alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conselhos_disciplinares" ADD CONSTRAINT "conselhos_disciplinares_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conselhos_disciplinares" ADD CONSTRAINT "conselhos_disciplinares_presidido_por_id_fkey" FOREIGN KEY ("presidido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conselhos_disciplinares" ADD CONSTRAINT "conselhos_disciplinares_instaurado_por_id_fkey" FOREIGN KEY ("instaurado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

