import { ROLE_CODES } from "@/modules/rbac/permissions";

// Link temporario de nova senha: gerado por um gestor e repassado por
// WhatsApp/telefone. Sem e-mail. Uso unico; gerar outro cancela o anterior.
export const RESET_TOKEN_TTL_HORAS = 24;
export const RESET_TOKEN_TTL_MINUTOS = RESET_TOKEN_TTL_HORAS * 60;

export function expiracaoLinkTemporario(agora: Date): Date {
  return new Date(agora.getTime() + RESET_TOKEN_TTL_MINUTOS * 60 * 1000);
}

export function tokenRecuperacaoVigente(
  registro: {
    usedAt: Date | null;
    expiresAt: Date;
    usuario: { ativo: boolean };
  },
  agora: Date,
): boolean {
  return (
    registro.usedAt === null &&
    registro.expiresAt.getTime() > agora.getTime() &&
    registro.usuario.ativo
  );
}

export type OrigemLinkTemporario = "EQUIPE" | "RESPONSAVEL";

export type AlvoLinkTemporario = {
  ativo: boolean;
  vinculoAtivoNoColegio: boolean;
  ehResponsavel: boolean;
  // Perfis em TODOS os colegios: a senha e global, entao um perfil de outro
  // colegio tambem conta para proteger a conta.
  perfis: readonly string[];
};

export type BloqueioLinkTemporario =
  | "USUARIO_INATIVO"
  | "SEM_VINCULO"
  | "ADMINISTRADOR_PROTEGIDO"
  | "NAO_RESPONSAVEL"
  | "CONTA_DE_EQUIPE"
  | "CONTA_DE_RESPONSAVEL";

export function temPerfilDeEquipe(perfis: readonly string[]): boolean {
  return perfis.some((perfil) => perfil !== ROLE_CODES.RESPONSAVEL);
}

// Retorna o motivo do bloqueio, ou null quando o link pode ser gerado.
// Quem administra responsaveis nao pode assumir a conta de um colega da equipe
// que tambem seja responsavel; esse caso so e atendido pela tela de usuarios.
export function bloqueioLinkTemporario(
  origem: OrigemLinkTemporario,
  perfisDoAtor: readonly string[],
  alvo: AlvoLinkTemporario,
): BloqueioLinkTemporario | null {
  if (!alvo.ativo) {
    return "USUARIO_INATIVO";
  }
  if (!alvo.vinculoAtivoNoColegio) {
    return "SEM_VINCULO";
  }
  if (
    alvo.perfis.includes(ROLE_CODES.ADMINISTRADOR) &&
    !perfisDoAtor.includes(ROLE_CODES.ADMINISTRADOR)
  ) {
    return "ADMINISTRADOR_PROTEGIDO";
  }

  const equipe = temPerfilDeEquipe(alvo.perfis);
  if (origem === "RESPONSAVEL") {
    if (!alvo.ehResponsavel) {
      return "NAO_RESPONSAVEL";
    }
    if (equipe) {
      return "CONTA_DE_EQUIPE";
    }
    return null;
  }

  if (alvo.ehResponsavel && !equipe) {
    return "CONTA_DE_RESPONSAVEL";
  }
  return null;
}
