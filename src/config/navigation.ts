import { PERMISSIONS } from "@/modules/rbac/permissions";

export type GrupoMenu = "DISCIPLINA" | "CADASTROS" | "ADMINISTRACAO" | "CONTA";

export type NavItem = {
  href: string;
  grupo: GrupoMenu;
  label: string;
  permission: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    grupo: "DISCIPLINA",
    label: "Painel",
    permission: PERMISSIONS.DASHBOARD_ACCESS,
  },
  {
    href: "/colegios",
    grupo: "ADMINISTRACAO",
    label: "Colégios",
    permission: PERMISSIONS.COLEGIOS_MANAGE,
  },
  {
    href: "/usuarios",
    grupo: "ADMINISTRACAO",
    label: "Usuários",
    permission: PERMISSIONS.USUARIOS_MANAGE,
  },
  {
    href: "/rbac",
    grupo: "ADMINISTRACAO",
    label: "Perfis",
    permission: PERMISSIONS.RBAC_MANAGE,
  },
  {
    href: "/alunos",
    grupo: "CADASTROS",
    label: "Alunos",
    permission: PERMISSIONS.ALUNOS_READ,
  },
  {
    href: "/responsaveis",
    grupo: "CADASTROS",
    label: "Responsáveis",
    permission: PERMISSIONS.RESPONSAVEIS_READ,
  },
  {
    href: "/turmas",
    grupo: "CADASTROS",
    label: "Turmas",
    permission: PERMISSIONS.TURMAS_READ,
  },
  {
    href: "/anos-letivos",
    grupo: "CADASTROS",
    label: "Anos letivos",
    permission: PERMISSIONS.ANOS_LETIVOS_MANAGE,
  },
  {
    href: "/matriculas",
    grupo: "CADASTROS",
    label: "Matrículas",
    permission: PERMISSIONS.MATRICULAS_READ,
  },
  {
    href: "/disciplina/ocorrencias",
    grupo: "DISCIPLINA",
    label: "Ocorrências",
    permission: PERMISSIONS.OCORRENCIAS_READ_OWN,
  },
  {
    href: "/disciplina/painel",
    grupo: "DISCIPLINA",
    label: "Painel disciplinar",
    permission: PERMISSIONS.COMPORTAMENTO_READ,
  },
  {
    href: "/disciplina/reconsideracoes",
    grupo: "DISCIPLINA",
    label: "Reconsiderações",
    permission: PERMISSIONS.RECONSIDERACOES_DECIDE,
  },
  {
    href: "/disciplina/comportamento",
    grupo: "DISCIPLINA",
    label: "Comportamento",
    permission: PERMISSIONS.COMPORTAMENTO_READ,
  },
  {
    href: "/disciplina/catalogos",
    grupo: "DISCIPLINA",
    label: "Catálogos disciplinares",
    permission: PERMISSIONS.DISCIPLINA_CATALOGOS_READ,
  },
  {
    href: "/auditoria",
    grupo: "ADMINISTRACAO",
    label: "Auditoria",
    permission: PERMISSIONS.AUDITORIA_READ,
  },
  {
    href: "/conta",
    grupo: "CONTA",
    label: "Minha conta",
    permission: PERMISSIONS.DASHBOARD_ACCESS,
  },
];

export type IconeMenu = "inicio" | "lista" | "novo" | "balanca" | "pessoas";

export type ItemPrincipal = {
  href: string;
  label: string;
  icone: IconeMenu;
  permission: string;
};

// Destinos da barra inferior do celular, em ordem de prioridade.
const CANDIDATOS_PRINCIPAIS: ItemPrincipal[] = [
  {
    href: "/dashboard",
    label: "Início",
    icone: "inicio",
    permission: PERMISSIONS.DASHBOARD_ACCESS,
  },
  {
    href: "/disciplina/ocorrencias",
    label: "Ocorrências",
    icone: "lista",
    permission: PERMISSIONS.OCORRENCIAS_READ_OWN,
  },
  {
    href: "/disciplina/ocorrencias/nova",
    label: "Nova",
    icone: "novo",
    permission: PERMISSIONS.OCORRENCIAS_CREATE,
  },
  {
    href: "/disciplina/reconsideracoes",
    label: "Reconsiderar",
    icone: "balanca",
    permission: PERMISSIONS.RECONSIDERACOES_DECIDE,
  },
  {
    href: "/disciplina/comportamento",
    label: "Conduta",
    icone: "pessoas",
    permission: PERMISSIONS.COMPORTAMENTO_READ,
  },
];

const LIMITE_PRINCIPAIS = 4;

const ORDEM_GRUPOS: { grupo: GrupoMenu; titulo: string }[] = [
  { grupo: "DISCIPLINA", titulo: "Disciplina" },
  { grupo: "CADASTROS", titulo: "Cadastros" },
  { grupo: "ADMINISTRACAO", titulo: "Administração" },
  { grupo: "CONTA", titulo: "Conta" },
];

export function montarMenuCelular(permissoes: readonly string[]) {
  const principais = CANDIDATOS_PRINCIPAIS.filter((item) =>
    permissoes.includes(item.permission),
  ).slice(0, LIMITE_PRINCIPAIS);
  const hrefsPrincipais = new Set(principais.map((item) => item.href));
  const restantes = NAV_ITEMS.filter(
    (item) =>
      permissoes.includes(item.permission) && !hrefsPrincipais.has(item.href),
  );
  const grupos = ORDEM_GRUPOS.map(({ grupo, titulo }) => ({
    titulo,
    itens: restantes
      .filter((item) => item.grupo === grupo)
      .map(({ href, label }) => ({ href, label })),
  })).filter((grupo) => grupo.itens.length > 0);

  return {
    principais: principais.map(({ href, label, icone }) => ({
      href,
      label,
      icone,
    })),
    grupos,
  };
}

// O caminho mais especifico vence: /ocorrencias/nova marca "Nova", nao a lista.
export function hrefAtivo(
  pathname: string,
  hrefs: readonly string[],
): string | null {
  return (
    hrefs
      .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}
