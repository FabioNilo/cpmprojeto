-- CreateEnum
CREATE TYPE "NaturezaTransgressao" AS ENUM ('LEVE', 'MEDIA', 'GRAVE', 'ELIMINATORIA');

-- CreateTable
CREATE TABLE "transgressoes" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "natureza" "NaturezaTransgressao" NOT NULL,
    "base_legal" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transgressoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atenuantes" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atenuantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agravantes" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agravantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_sancao" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "impacto_pontos" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "gera_afastamento" BOOLEAN NOT NULL DEFAULT false,
    "eh_desligamento" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_sancao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_elogio" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor_pontos" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_elogio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faixas_comportamento" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "limite_inferior" DECIMAL(4,2) NOT NULL,
    "limite_superior" DECIMAL(4,2) NOT NULL,
    "ordem" INTEGER NOT NULL,
    "exige_acompanhamento" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faixas_comportamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competencias_disciplinares" (
    "id" UUID NOT NULL,
    "perfil_codigo" TEXT NOT NULL,
    "tipo_ato" TEXT NOT NULL,
    "tipo_sancao_max_codigo" TEXT,
    "dias_max" INTEGER,
    "natureza_max" "NaturezaTransgressao",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competencias_disciplinares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prazos_processuais" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "unidade" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prazos_processuais_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transgressoes_codigo_key" ON "transgressoes"("codigo");

-- CreateIndex
CREATE INDEX "transgressoes_natureza_ativo_idx" ON "transgressoes"("natureza", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "atenuantes_codigo_key" ON "atenuantes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "agravantes_codigo_key" ON "agravantes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_sancao_codigo_key" ON "tipos_sancao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_sancao_ordem_key" ON "tipos_sancao"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_elogio_codigo_key" ON "tipos_elogio"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "faixas_comportamento_codigo_key" ON "faixas_comportamento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "faixas_comportamento_ordem_key" ON "faixas_comportamento"("ordem");

-- CreateIndex
CREATE UNIQUE INDEX "competencias_disciplinares_perfil_codigo_tipo_ato_key" ON "competencias_disciplinares"("perfil_codigo", "tipo_ato");

-- CreateIndex
CREATE UNIQUE INDEX "prazos_processuais_codigo_key" ON "prazos_processuais"("codigo");
