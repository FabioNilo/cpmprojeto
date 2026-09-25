import { ROLE_CODES } from "../permissions";

export type PerfilRef = {
  codigo: string;
  sistema: boolean;
};

// Perfis cujo conjunto de permissoes nao pode ser editado pela interface:
// o ADMINISTRADOR precisa manter acesso total para nao haver auto-bloqueio.
export const PERFIS_COM_PERMISSOES_TRAVADAS: string[] = [
  ROLE_CODES.ADMINISTRADOR,
];

export function ehAdministrador(contextPerfis: string[]): boolean {
  return contextPerfis.includes(ROLE_CODES.ADMINISTRADOR);
}

// Somente um administrador pode tocar no perfil ADMINISTRADOR.
export function podeGerenciarPerfil(
  perfil: PerfilRef,
  contextPerfis: string[],
): boolean {
  if (perfil.codigo === ROLE_CODES.ADMINISTRADOR) {
    return ehAdministrador(contextPerfis);
  }

  return true;
}

// Identidade (codigo/nome/descricao/ativo) de perfil de sistema e imutavel.
export function podeAlterarIdentidadeDoPerfil(perfil: PerfilRef): boolean {
  return !perfil.sistema;
}

// Permissoes de perfis de sistema PODEM ser ajustadas (esse e o objetivo da
// tela), exceto os travados e respeitando a alcada do ADMINISTRADOR.
export function podeEditarPermissoesDoPerfil(
  perfil: PerfilRef,
  contextPerfis: string[],
): boolean {
  if (PERFIS_COM_PERMISSOES_TRAVADAS.includes(perfil.codigo)) {
    return false;
  }

  return podeGerenciarPerfil(perfil, contextPerfis);
}
