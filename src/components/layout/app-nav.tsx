"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppNavItem = {
  href: string;
  label: string;
};

type AppNavProps = {
  items: AppNavItem[];
};

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav({ items }: AppNavProps) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  // Fecha o menu ao trocar de rota.
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  const atual = items.find((item) => isActive(pathname, item.href));

  return (
    <div className="md:mt-0">
      {/* Barra compacta (somente mobile) */}
      <div className="flex items-center justify-between gap-3 md:hidden">
        <span className="truncate text-sm font-semibold text-slate-700">
          {atual?.label ?? "Menu"}
        </span>
        <button
          aria-controls="menu-principal"
          aria-expanded={aberto}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700"
          onClick={() => setAberto((v) => !v)}
          type="button"
        >
          <span aria-hidden className="text-lg leading-none">
            {aberto ? "✕" : "☰"}
          </span>
        </button>
      </div>

      <nav
        aria-label="Navegação principal"
        className={`${
          aberto ? "flex" : "hidden"
        } mt-2 flex-col gap-1 md:mt-0 md:flex md:flex-row md:flex-wrap`}
        id="menu-principal"
      >
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2 text-sm font-semibold ${
                active
                  ? "bg-navy-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
