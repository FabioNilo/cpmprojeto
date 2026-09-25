import { randomInt } from "node:crypto";

// Sem caracteres ambiguos (0/O, 1/I/l).
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function gerarSenhaProvisoria(tamanho = 10): string {
  let senha = "";
  for (let i = 0; i < tamanho; i += 1) {
    senha += ALFABETO[randomInt(ALFABETO.length)];
  }
  // grupos de 4 para leitura/ditado: XXXX-XXXX-XX
  return senha.replace(/(.{4})(?=.)/g, "$1-");
}
