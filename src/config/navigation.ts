import { PERMISSIONS } from "@/modules/rbac/permissions";

export type NavItem = {
  href: string;
  label: string;
  permission: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Painel",
    permission: PERMISSIONS.DASHBOARD_ACCESS,
  },
  {
    href: "/colegios",
    label: "Colégios",
    permission: PERMISSIONS.COLEGIOS_MANAGE,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    permission: PERMISSIONS.USUARIOS_MANAGE,
  },
  {
    href: "/rbac",
    label: "Perfis",
    permission: PERMISSIONS.RBAC_MANAGE,
  },
  {
    href: "/alunos",
    label: "Alunos",
    permission: PERMISSIONS.ALUNOS_READ,
  },
  {
    href: "/responsaveis",
    label: "Responsáveis",
    permission: PERMISSIONS.RESPONSAVEIS_READ,
  },
  {
    href: "/turmas",
    label: "Turmas",
    permission: PERMISSIONS.TURMAS_READ,
  },
  {
    href: "/anos-letivos",
    label: "Anos letivos",
    permission: PERMISSIONS.ANOS_LETIVOS_MANAGE,
  },
  {
    href: "/matriculas",
    label: "Matrículas",
    permission: PERMISSIONS.MATRICULAS_READ,
  },
  {
    href: "/disciplina/ocorrencias",
    label: "Ocorrências",
    permission: PERMISSIONS.OCORRENCIAS_READ_OWN,
  },
  {
    href: "/disciplina/painel",
    label: "Painel disciplinar",
    permission: PERMISSIONS.COMPORTAMENTO_READ,
  },
  {
    href: "/disciplina/reconsideracoes",
    label: "Reconsiderações",
    permission: PERMISSIONS.RECONSIDERACOES_DECIDE,
  },
  {
    href: "/disciplina/comportamento",
    label: "Comportamento",
    permission: PERMISSIONS.COMPORTAMENTO_READ,
  },
  {
    href: "/disciplina/catalogos",
    label: "Catálogos disciplinares",
    permission: PERMISSIONS.DISCIPLINA_CATALOGOS_READ,
  },
  {
    href: "/auditoria",
    label: "Auditoria",
    permission: PERMISSIONS.AUDITORIA_READ,
  },
  {
    href: "/conta",
    label: "Minha conta",
    permission: PERMISSIONS.DASHBOARD_ACCESS,
  },
];
