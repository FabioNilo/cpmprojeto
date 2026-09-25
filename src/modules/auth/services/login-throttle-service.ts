import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/db/prisma";
import type { RequestMetadata } from "@/lib/http/request-metadata";

type ThrottleDb = Prisma.TransactionClient | PrismaClient;

export const LOGIN_JANELA_MINUTOS = 15;
export const LOGIN_LIMITE_IDENTIFICADOR = 5;
export const LOGIN_LIMITE_IP = 20;

export type BloqueioLogin =
  | { bloqueado: false }
  | { bloqueado: true; motivo: "IDENTIFICADOR" | "IP" };

export function decidirBloqueioLogin(input: {
  falhasIdentificador: number;
  falhasIp: number;
  limiteIdentificador?: number;
  limiteIp?: number;
}): BloqueioLogin {
  const limiteIdentificador =
    input.limiteIdentificador ?? LOGIN_LIMITE_IDENTIFICADOR;
  const limiteIp = input.limiteIp ?? LOGIN_LIMITE_IP;

  if (input.falhasIdentificador >= limiteIdentificador) {
    return { bloqueado: true, motivo: "IDENTIFICADOR" };
  }
  if (input.falhasIp >= limiteIp) {
    return { bloqueado: true, motivo: "IP" };
  }

  return { bloqueado: false };
}

export async function registrarTentativaLogin(
  input: {
    identificador: string;
    ip?: string;
    sucesso: boolean;
    metadata?: RequestMetadata;
  },
  db: ThrottleDb = prisma,
): Promise<void> {
  await db.tentativaLogin.create({
    data: {
      identificador: input.identificador,
      ip: input.ip ?? input.metadata?.ip,
      sucesso: input.sucesso,
      userAgent: input.metadata?.userAgent,
    },
  });
}

export async function avaliarBloqueioLogin(input: {
  identificador: string;
  ip?: string;
}): Promise<BloqueioLogin> {
  const janelaInicio = new Date(Date.now() - LOGIN_JANELA_MINUTOS * 60 * 1000);

  const ultimoSucesso = await prisma.tentativaLogin.findFirst({
    where: { identificador: input.identificador, sucesso: true },
    orderBy: { criadoEm: "desc" },
    select: { criadoEm: true },
  });

  const desdeIdentificador =
    ultimoSucesso && ultimoSucesso.criadoEm > janelaInicio
      ? ultimoSucesso.criadoEm
      : janelaInicio;

  const [falhasIdentificador, falhasIp] = await Promise.all([
    prisma.tentativaLogin.count({
      where: {
        identificador: input.identificador,
        sucesso: false,
        criadoEm: { gt: desdeIdentificador },
      },
    }),
    input.ip
      ? prisma.tentativaLogin.count({
          where: {
            ip: input.ip,
            sucesso: false,
            criadoEm: { gte: janelaInicio },
          },
        })
      : Promise.resolve(0),
  ]);

  return decidirBloqueioLogin({ falhasIdentificador, falhasIp });
}
