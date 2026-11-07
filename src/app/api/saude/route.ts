import { timingSafeEqual } from "node:crypto";

import { obterSaude } from "@/modules/saude/services/medir-saude";

export const dynamic = "force-dynamic";

function tokenValido(request: Request): boolean {
  const esperado = process.env.MONITOR_TOKEN;
  if (!esperado) {
    return false;
  }
  const enviado = request.headers.get("authorization") ?? "";
  const informado = Buffer.from(enviado.replace(/^Bearer\s+/i, ""));
  const correto = Buffer.from(esperado);
  return (
    informado.length === correto.length && timingSafeEqual(informado, correto)
  );
}

// Rota publica para o verificador externo. Sem token, responde so o estado
// e os codigos dos alertas, sem numeros. Com `Authorization: Bearer <token>`
// (MONITOR_TOKEN), inclui medidas e limites.
// 200 = ok. 503 = atencao ou critico, para o verificador avisar.
export async function GET(request: Request) {
  const saude = await obterSaude();
  const base = {
    status: saude.status,
    alertas: saude.alertas.map((alerta) => alerta.codigo),
  };
  const corpo = tokenValido(request)
    ? {
        ...base,
        niveis: saude.alertas,
        medidas: saude.medidas,
        limites: saude.limites,
        medidoEm: saude.medidoEm,
      }
    : base;

  return Response.json(corpo, {
    status: saude.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
