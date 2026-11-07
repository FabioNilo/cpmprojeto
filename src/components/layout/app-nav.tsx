"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { hrefAtivo } from "@/config/navigation";

type AppNavItem = {
  href: string;
  label: string;
};

type AppNavProps = {
  items: AppNavItem[];
};

// Menu do computador. No celular, a navegacao fica em MobileNav.
export function AppNav({ items }: AppNavProps) {
  const pathname = usePathname();
  const ativo = hrefAtivo(
    pathname,
    items.map((item) => item.href),
  );

  return (
    <nav
      aria-label="Navegação principal"
      className="flex flex-row flex-wrap gap-1"
    >
      {items.map((item) => {
        const active = item.href === ativo;
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
  );
}
