"use client";

import { useState, useTransition } from "react";

import { buscarConteudoFichaAction } from "../actions/buscar-conteudo-ficha-action";

// So busca o snapshot completo da FAD no clique - a pagina normal so tem
// versao/data/hash (ver get-ficha.ts). Evita carregar esse JSON do banco
// toda vez que a tela de comportamento abre.
export function VerConteudoFicha({ fichaId }: { fichaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [conteudo, setConteudo] = useState<unknown>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function alternar() {
    if (aberto) {
      setAberto(false);
      return;
    }
    setAberto(true);
    if (conteudo !== null) return;
    startTransition(async () => {
      const resultado = await buscarConteudoFichaAction(fichaId);
      if ("erro" in resultado) {
        setErro(resultado.erro);
      } else {
        setConteudo(resultado.conteudo);
      }
    });
  }

  return (
    <div>
      <button
        className="cursor-pointer text-sm font-semibold text-navy-900"
        onClick={alternar}
        type="button"
      >
        {aberto ? "▾" : "▸"} Ver conteúdo (snapshot)
      </button>
      {aberto ? (
        <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
          {pending
            ? "Carregando..."
            : (erro ?? JSON.stringify(conteudo, null, 2))}
        </pre>
      ) : null}
    </div>
  );
}
