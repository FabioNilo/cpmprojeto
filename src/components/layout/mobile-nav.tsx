"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { hrefAtivo, type IconeMenu } from "@/config/navigation";

type MobileNavProps = {
  principais: { href: string; label: string; icone: IconeMenu }[];
  grupos: { titulo: string; itens: { href: string; label: string }[] }[];
  colegioNome: string;
  // Trocar CPM e Sair, que dependem do servidor.
  extras: React.ReactNode;
};

const TEMPO_FECHAMENTO_MS = 160;

const TRACOS: Record<IconeMenu | "mais", React.ReactNode> = {
  inicio: <path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5" />,
  lista: <path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />,
  novo: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  balanca: <path d="M12 4.5v15M8 19.5h8M5 7.5h14M5 7.5l-2.5 6a2.8 2.8 0 0 0 5 0L5 7.5ZM19 7.5l-2.5 6a2.8 2.8 0 0 0 5 0L19 7.5Z" />,
  pessoas: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 19.5c.5-3.5 2.8-5.5 6-5.5s5.5 2 6 5.5M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.5 14.3c2 .7 3.2 2.6 3.5 5.2" />
    </>
  ),
  mais: <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />,
};

function Icone({ nome }: { nome: IconeMenu | "mais" }) {
  return (
    <svg
      aria-hidden
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.8}
      viewBox="0 0 24 24"
    >
      {TRACOS[nome]}
    </svg>
  );
}

const CLASSE_ITEM =
  "flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";

export function MobileNav({
  principais,
  grupos,
  colegioNome,
  extras,
}: MobileNavProps) {
  const pathname = usePathname();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [fechando, setFechando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hrefsPrincipais = principais.map((item) => item.href);
  const hrefsGrupos = grupos.flatMap((grupo) =>
    grupo.itens.map((item) => item.href),
  );
  const ativo = hrefAtivo(pathname, [...hrefsPrincipais, ...hrefsGrupos]);
  const maisAtivo = ativo !== null && hrefsGrupos.includes(ativo);

  const abrir = useCallback(() => {
    setFechando(false);
    dialogo.current?.showModal();
  }, []);

  const fechar = useCallback(() => {
    setFechando(true);
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }
    temporizador.current = setTimeout(() => {
      dialogo.current?.close();
      setFechando(false);
    }, TEMPO_FECHAMENTO_MS);
  }, []);

  // A troca de tela fecha o menu na hora, sem animar sobre a tela nova.
  useEffect(() => {
    if (temporizador.current) {
      clearTimeout(temporizador.current);
    }
    dialogo.current?.close();
    setFechando(false);
  }, [pathname]);

  useEffect(
    () => () => {
      if (temporizador.current) {
        clearTimeout(temporizador.current);
      }
    },
    [],
  );

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] print:hidden md:hidden"
      >
        {principais.map((item) => {
          const atual = item.href === ativo;
          return (
            <Link
              aria-current={atual ? "page" : undefined}
              className={`${CLASSE_ITEM} ${atual ? "text-navy-900" : "text-slate-500"}`}
              href={item.href}
              key={item.href}
            >
              <Icone nome={item.icone} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
        <button
          aria-haspopup="dialog"
          className={`${CLASSE_ITEM} ${maisAtivo ? "text-navy-900" : "text-slate-500"}`}
          onClick={abrir}
          type="button"
        >
          <Icone nome="mais" />
          Mais
        </button>
      </nav>

      <dialog
        aria-label="Mais opções"
        className="folha md:hidden"
        data-fechando={fechando ? "" : undefined}
        onCancel={(event) => {
          event.preventDefault();
          fechar();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            fechar();
          }
        }}
        ref={dialogo}
      >
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold text-slate-950">
              {colegioNome}
            </p>
            <button
              aria-label="Fechar"
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-slate-600"
              onClick={fechar}
              type="button"
            >
              <span aria-hidden className="text-lg leading-none">
                ✕
              </span>
            </button>
          </div>
          {grupos.map((grupo) => (
            <section className="mb-3" key={grupo.titulo}>
              <h2 className="mb-1 text-xs font-semibold uppercase text-gold-600">
                {grupo.titulo}
              </h2>
              <ul>
                {grupo.itens.map((item) => (
                  <li key={item.href}>
                    <Link
                      aria-current={item.href === ativo ? "page" : undefined}
                      className={`flex min-h-12 items-center rounded-md px-3 text-base font-medium ${
                        item.href === ativo
                          ? "bg-navy-900 text-white"
                          : "text-slate-800 active:bg-slate-100"
                      }`}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
            {extras}
          </div>
        </div>
      </dialog>
    </>
  );
}
