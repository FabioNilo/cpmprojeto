"use client";

import { useEffect } from "react";

// Permite instalar no celular e mostrar um aviso quando nao ha internet.
// O service worker nao guarda paginas nem dados de alunos.
export function RegistrarAplicativo() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  return null;
}
