import { prisma } from "@/db/prisma";

// Ordem nao importa: TRUNCATE ... CASCADE resolve as FKs.
const TABELAS = [
  "tokens_recuperacao_senha",
  "tentativas_login",
  "auditoria",
  "sessoes",
  "matriculas",
  "aluno_responsaveis",
  "aluno_vinculos_colegio",
  "alunos",
  "responsaveis",
  "turmas",
  "anos_letivos",
  "usuario_colegio_perfis",
  "usuario_colegios",
  "perfil_permissoes",
  "permissoes",
  "perfis",
  "usuarios",
  "colegios",
] as const;

export async function resetDatabase(): Promise<void> {
  const alvo = TABELAS.map((tabela) => `"${tabela}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${alvo} RESTART IDENTITY CASCADE;`,
  );
}
