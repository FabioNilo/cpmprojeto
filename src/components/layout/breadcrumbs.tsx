"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Painel",
  colegios: "Colégios",
  usuarios: "Usuários",
  rbac: "Perfis e permissões",
  alunos: "Alunos",
  responsaveis: "Responsáveis",
  turmas: "Turmas",
  "anos-letivos": "Anos letivos",
  matriculas: "Matrículas",
  disciplina: "Disciplina",
  catalogos: "Catálogos",
  ocorrencias: "Ocorrências",
  comportamento: "Comportamento",
  reconsideracoes: "Reconsiderações",
  painel: "Painel disciplinar",
  anexos: "Anexos",
  documento: "Documento",
  fad: "FAD",
  nova: "Nova",
  auditoria: "Auditoria",
  conta: "Minha conta",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Trilha de navegação" className="mb-4 text-xs text-slate-500">
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const label = SEGMENT_LABELS[segment] ?? segment;
        const isLast = index === segments.length - 1;

        return (
          <span key={href}>
            {index > 0 ? <span className="px-1">/</span> : null}
            {isLast ? (
              <span className="text-slate-700">{label}</span>
            ) : (
              <Link className="hover:underline" href={href}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
