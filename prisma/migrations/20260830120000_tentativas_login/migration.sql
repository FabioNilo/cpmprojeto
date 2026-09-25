-- CreateTable
CREATE TABLE "tentativas_login" (
    "id" UUID NOT NULL,
    "identificador" TEXT NOT NULL,
    "ip" TEXT,
    "sucesso" BOOLEAN NOT NULL,
    "user_agent" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tentativas_login_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tentativas_login_identificador_criado_em_idx" ON "tentativas_login"("identificador", "criado_em");

-- CreateIndex
CREATE INDEX "tentativas_login_ip_criado_em_idx" ON "tentativas_login"("ip", "criado_em");
