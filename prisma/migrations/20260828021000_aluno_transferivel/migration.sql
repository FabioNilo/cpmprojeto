-- CreateEnum
CREATE TYPE "StatusVinculoAluno" AS ENUM ('ATIVO', 'TRANSFERIDO', 'ENCERRADO');

-- Enable UUID generation for data backfill in this migration.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "aluno_vinculos_colegio" (
    "id" UUID NOT NULL,
    "aluno_id" UUID NOT NULL,
    "colegio_id" UUID NOT NULL,
    "status" "StatusVinculoAluno" NOT NULL DEFAULT 'ATIVO',
    "data_entrada" TIMESTAMP(3),
    "data_saida" TIMESTAMP(3),
    "motivo_saida" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aluno_vinculos_colegio_pkey" PRIMARY KEY ("id")
);

-- Prepare new identity fields while legacy columns still exist.
ALTER TABLE "alunos" ADD COLUMN "matricula_geral" TEXT;

ALTER TABLE "matriculas"
    ADD COLUMN "aluno_vinculo_colegio_id" UUID,
    ADD COLUMN "colegio_id" UUID;

-- Preserve existing single-school students as global identities with one CPM link.
UPDATE "alunos"
SET "matricula_geral" = "matricula"
WHERE "matricula" IS NOT NULL;

INSERT INTO "aluno_vinculos_colegio" (
    "id",
    "aluno_id",
    "colegio_id",
    "status",
    "data_entrada",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "id",
    "colegio_id",
    'ATIVO'::"StatusVinculoAluno",
    "created_at",
    "created_at",
    "updated_at"
FROM "alunos";

UPDATE "matriculas" AS "m"
SET "colegio_id" = "a"."colegio_id"
FROM "alunos" AS "a"
WHERE "m"."aluno_id" = "a"."id";

UPDATE "matriculas" AS "m"
SET "aluno_vinculo_colegio_id" = "avc"."id"
FROM "aluno_vinculos_colegio" AS "avc"
WHERE "m"."aluno_id" = "avc"."aluno_id"
  AND "m"."colegio_id" = "avc"."colegio_id";

ALTER TABLE "matriculas"
    ALTER COLUMN "aluno_vinculo_colegio_id" SET NOT NULL,
    ALTER COLUMN "colegio_id" SET NOT NULL;

-- Replace old tenant constraints with transfer-aware constraints.
ALTER TABLE "alunos" DROP CONSTRAINT "alunos_colegio_id_fkey";
ALTER TABLE "matriculas" DROP CONSTRAINT "matriculas_ano_letivo_id_fkey";
ALTER TABLE "matriculas" DROP CONSTRAINT "matriculas_turma_id_fkey";

DROP INDEX "alunos_colegio_id_ativo_idx";
DROP INDEX "alunos_colegio_id_matricula_key";
DROP INDEX "matriculas_aluno_id_ano_letivo_id_key";

ALTER TABLE "alunos"
    DROP COLUMN "colegio_id",
    DROP COLUMN "matricula";

-- CreateIndex
CREATE INDEX "aluno_vinculos_colegio_colegio_id_status_idx" ON "aluno_vinculos_colegio"("colegio_id", "status");
CREATE INDEX "aluno_vinculos_colegio_aluno_id_status_idx" ON "aluno_vinculos_colegio"("aluno_id", "status");
CREATE UNIQUE INDEX "aluno_vinculos_colegio_aluno_id_colegio_id_key" ON "aluno_vinculos_colegio"("aluno_id", "colegio_id");
CREATE UNIQUE INDEX "aluno_vinculos_colegio_id_aluno_id_colegio_id_key" ON "aluno_vinculos_colegio"("id", "aluno_id", "colegio_id");
CREATE UNIQUE INDEX "alunos_matricula_geral_key" ON "alunos"("matricula_geral");
CREATE INDEX "alunos_ativo_idx" ON "alunos"("ativo");
CREATE UNIQUE INDEX "anos_letivos_id_colegio_id_key" ON "anos_letivos"("id", "colegio_id");
CREATE INDEX "matriculas_colegio_id_ativa_idx" ON "matriculas"("colegio_id", "ativa");
CREATE UNIQUE INDEX "matriculas_aluno_id_colegio_id_ano_letivo_id_key" ON "matriculas"("aluno_id", "colegio_id", "ano_letivo_id");
CREATE UNIQUE INDEX "turmas_id_colegio_id_ano_letivo_id_key" ON "turmas"("id", "colegio_id", "ano_letivo_id");

-- AddForeignKey
ALTER TABLE "aluno_vinculos_colegio" ADD CONSTRAINT "aluno_vinculos_colegio_aluno_id_fkey" FOREIGN KEY ("aluno_id") REFERENCES "alunos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "aluno_vinculos_colegio" ADD CONSTRAINT "aluno_vinculos_colegio_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_colegio_id_fkey" FOREIGN KEY ("colegio_id") REFERENCES "colegios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_aluno_vinculo_colegio_id_aluno_id_colegio_id_fkey" FOREIGN KEY ("aluno_vinculo_colegio_id", "aluno_id", "colegio_id") REFERENCES "aluno_vinculos_colegio"("id", "aluno_id", "colegio_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_turma_id_colegio_id_ano_letivo_id_fkey" FOREIGN KEY ("turma_id", "colegio_id", "ano_letivo_id") REFERENCES "turmas"("id", "colegio_id", "ano_letivo_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_ano_letivo_id_colegio_id_fkey" FOREIGN KEY ("ano_letivo_id", "colegio_id") REFERENCES "anos_letivos"("id", "colegio_id") ON DELETE RESTRICT ON UPDATE CASCADE;
