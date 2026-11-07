"use client";

import { ErroPagina } from "@/components/layout/erro-pagina";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErroPagina error={error} reset={reset} voltarPara="/meus-filhos" />;
}
