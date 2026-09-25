-- CreateTable
CREATE TABLE "fichas_disciplinares" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "versao" INTEGER NOT NULL,
    "conteudo" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "gerado_por_id" UUID NOT NULL,
    "gerado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichas_disciplinares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fichas_disciplinares_colegio_id_gerado_em_idx" ON "fichas_disciplinares"("colegio_id", "gerado_em");

-- CreateIndex
CREATE UNIQUE INDEX "fichas_disciplinares_aluno_id_colegio_id_versao_key" ON "fichas_disciplinares"("aluno_id", "colegio_id", "versao");

-- AddForeignKey
ALTER TABLE "fichas_disciplinares" ADD CONSTRAINT "fichas_disciplinares_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_disciplinares" ADD CONSTRAINT "fichas_disciplinares_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_disciplinares" ADD CONSTRAINT "fichas_disciplinares_gerado_por_id_fkey" FOREIGN KEY ("gerado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

