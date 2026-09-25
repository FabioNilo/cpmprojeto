/**
 * Fase B (passo 2) - carga do CPM Romulo Galvao no schema `cpm` do Supabase.
 *
 *   npm run import:load           # idempotente (upsert)
 *   npm run import:load -- --reset  # apaga as linhas do colegio RG e recarrega
 *
 * Le prisma/import/.data/romulo-galvao.json (gerado por 02-extract.py).
 * NUNCA aponte para o schema cpm_test.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../../src/lib/security/password";
import { createSessionToken } from "../../src/lib/security/token";

const prisma = new PrismaClient();
const RESET = process.argv.includes("--reset");

const HERE = dirname(fileURLToPath(import.meta.url));

type TurmaInfo = {
  nome: string | null;
  curso: number | null;
  nivel: string | null;
  turno: string | null;
  letra: string | null;
};
type AlunoIn = {
  matricula: string;
  nome: string;
  sexo: string | null;
  transferido: boolean;
  turma: TurmaInfo;
};
type OcorrenciaIn = {
  matricula: string;
  disposicao: string | null;
  texto: string | null;
  cienciaResp: boolean;
  numeroBic: string | null;
  numeroComunicacao: string | null;
  numeroNotificacao: string | null;
  dataOcorrencia: string | null;
  dataNotificacao: string | null;
  dataComparecimento: string | null;
};
type Payload = {
  colegio: { codigo: string; nome: string };
  anoLetivo: number;
  alunos: AlunoIn[];
  ocorrencias: OcorrenciaIn[];
};

const DISPOSICAO_TIPO_SANCAO: Record<string, string> = {
  "ADVERTÊNCIA": "ADVERTENCIA",
  "REPREENSÃO": "REPREENSAO",
  "REPREENSAO": "REPREENSAO",
  "IMPEDIMENTO": "IMPEDIMENTO",
  "ARQUIVAMENTO": "ARQUIVAMENTO",
};

function mapDisposicao(raw: string | null): string {
  if (!raw) return "NAO_INFORMADA";
  if (DISPOSICAO_TIPO_SANCAO[raw]) return DISPOSICAO_TIPO_SANCAO[raw];
  if (raw.startsWith("Suspensão S/P")) return "SUSPENSAO_SEM_PREJUIZO";
  if (raw.startsWith("Suspensão das atividades")) return "SUSPENSAO_COM_PREJUIZO";
  return "OUTRA";
}

async function main() {
  const payload: Payload = JSON.parse(
    readFileSync(join(HERE, ".data", "romulo-galvao.json"), "utf8"),
  );
  console.log(
    `carga: ${payload.alunos.length} alunos, ${payload.ocorrencias.length} ocorrencias`,
  );

  // --- Colegio -------------------------------------------------------------
  const colegio = await prisma.colegio.upsert({
    where: { codigo: payload.colegio.codigo },
    update: { nome: payload.colegio.nome, ativo: true },
    create: { codigo: payload.colegio.codigo, nome: payload.colegio.nome },
  });

  if (RESET) {
    console.log("--reset: limpando dados do colegio RG...");
    await prisma.ocorrenciaAluno.deleteMany({
      where: { ocorrencia: { colegioId: colegio.id } },
    });
    await prisma.ocorrencia.deleteMany({ where: { colegioId: colegio.id } });
    await prisma.matricula.deleteMany({ where: { colegioId: colegio.id } });
    await prisma.alunoVinculoColegio.deleteMany({
      where: { colegioId: colegio.id },
    });
    await prisma.aluno.deleteMany({ where: { vinculosColegio: { none: {} } } });
    await prisma.turma.deleteMany({ where: { colegioId: colegio.id } });
    await prisma.anoLetivo.deleteMany({ where: { colegioId: colegio.id } });
  }

  // --- Usuarios: import.sef + admin no colegio RG -----------------------
  const sef = await prisma.usuario.upsert({
    where: { username: "import.sef" },
    update: {},
    create: {
      nome: "Importacao SEF (bancoFad)",
      username: "import.sef",
      passwordHash: await hashPassword(createSessionToken()),
    },
  });
  await prisma.usuarioColegio.upsert({
    where: { usuarioId_colegioId: { usuarioId: sef.id, colegioId: colegio.id } },
    update: { ativo: true },
    create: { usuarioId: sef.id, colegioId: colegio.id },
  });

  const admin = await prisma.usuario.findUnique({ where: { username: "admin" } });
  const perfilAdmin = await prisma.perfil.findUnique({
    where: { codigo: "ADMINISTRADOR" },
  });
  if (admin && perfilAdmin) {
    const vinc = await prisma.usuarioColegio.upsert({
      where: {
        usuarioId_colegioId: { usuarioId: admin.id, colegioId: colegio.id },
      },
      update: { ativo: true },
      create: { usuarioId: admin.id, colegioId: colegio.id },
    });
    await prisma.usuarioColegioPerfil.upsert({
      where: {
        usuarioColegioId_perfilId: {
          usuarioColegioId: vinc.id,
          perfilId: perfilAdmin.id,
        },
      },
      update: {},
      create: { usuarioColegioId: vinc.id, perfilId: perfilAdmin.id },
    });
  }

  // --- Ano letivo -------------------------------------------------------
  const anoLetivo = await prisma.anoLetivo.upsert({
    where: {
      colegioId_ano: { colegioId: colegio.id, ano: payload.anoLetivo },
    },
    update: { ativo: true },
    create: { colegioId: colegio.id, ano: payload.anoLetivo },
  });

  // --- Turmas --------------------------------------------------------------
  const turmasPorNome = new Map<string, TurmaInfo>();
  for (const a of payload.alunos) {
    if (a.turma.nome && !a.turma.nome.includes("?")) {
      turmasPorNome.set(a.turma.nome, a.turma);
    }
  }
  const turmaIdPorNome = new Map<string, string>();
  for (const [nome, info] of turmasPorNome) {
    const t = await prisma.turma.upsert({
      where: {
        colegioId_anoLetivoId_nome: {
          colegioId: colegio.id,
          anoLetivoId: anoLetivo.id,
          nome,
        },
      },
      update: { turno: info.turno, ativa: true },
      create: {
        colegioId: colegio.id,
        anoLetivoId: anoLetivo.id,
        nome,
        turno: info.turno,
      },
    });
    turmaIdPorNome.set(nome, t.id);
  }
  console.log(`turmas: ${turmaIdPorNome.size}`);

  // --- Alunos + vinculos + matriculas -----------------------------------
  const alunoIdPorMatricula = new Map<string, string>();
  let comMatricula = 0;
  for (const a of payload.alunos) {
    const aluno = await prisma.aluno.upsert({
      where: { matriculaGeral: a.matricula },
      update: { nome: a.nome },
      create: { nome: a.nome, matriculaGeral: a.matricula },
    });
    alunoIdPorMatricula.set(a.matricula, aluno.id);

    const vinculo = await prisma.alunoVinculoColegio.upsert({
      where: {
        alunoId_colegioId: { alunoId: aluno.id, colegioId: colegio.id },
      },
      update: { status: "ATIVO" },
      create: { alunoId: aluno.id, colegioId: colegio.id, status: "ATIVO" },
    });

    const turmaId = a.turma.nome ? turmaIdPorNome.get(a.turma.nome) : undefined;
    if (turmaId) {
      await prisma.matricula.upsert({
        where: {
          alunoId_colegioId_anoLetivoId: {
            alunoId: aluno.id,
            colegioId: colegio.id,
            anoLetivoId: anoLetivo.id,
          },
        },
        update: { turmaId, alunoVinculoColegioId: vinculo.id, ativa: true },
        create: {
          alunoId: aluno.id,
          colegioId: colegio.id,
          alunoVinculoColegioId: vinculo.id,
          turmaId,
          anoLetivoId: anoLetivo.id,
          numero: a.matricula,
        },
      });
      comMatricula += 1;
    }
  }
  console.log(`alunos: ${alunoIdPorMatricula.size} (com matricula: ${comMatricula})`);

  // --- Ocorrencias (FICHA) -------------------------------------------------
  const jaImportadas = await prisma.ocorrencia.count({
    where: { colegioId: colegio.id, comunicanteId: sef.id },
  });
  if (jaImportadas > 0 && !RESET) {
    console.log(
      `ocorrencias: ${jaImportadas} ja importadas, pulando (use --reset para recarregar).`,
    );
  } else {
    let criadas = 0;
    let semAluno = 0;
    for (const o of payload.ocorrencias) {
      const alunoId = alunoIdPorMatricula.get(o.matricula);
      if (!alunoId) {
        semAluno += 1;
        continue;
      }
      const codigoDisp = mapDisposicao(o.disposicao);
      const arquivada = codigoDisp === "ARQUIVAMENTO";
      const numero = o.numeroComunicacao ?? `RG-IMP-${criadas + 1}`;
      const data = o.dataOcorrencia
        ? new Date(o.dataOcorrencia)
        : new Date("2026-08-20T00:00:00");
      const descricao = [
        o.texto ?? "(sem descricao no bancoFad)",
        `\n--\nImportado do bancoFad (SEF). Disposicao registrada: ${o.disposicao ?? "-"}`,
        o.numeroBic ? `BIC ${o.numeroBic}` : null,
        o.numeroNotificacao ? `Notificacao ${o.numeroNotificacao}` : null,
        o.cienciaResp ? "Responsavel deu ciencia (ASS P/ RESP = SIM)." : null,
      ]
        .filter(Boolean)
        .join(" ");

      await prisma.ocorrencia.create({
        data: {
          colegioId: colegio.id,
          comunicanteId: sef.id,
          tipo: "DISCIPLINAR",
          status: "ENCERRADA",
          numero,
          anoNumeracao: 2026,
          dataOcorrencia: data,
          descricao,
          enviadaEm: data,
          encerradaEm: new Date("2026-08-20T00:00:00"),
          alunos: {
            create: {
              alunoId,
              ordem: 1,
              numeroProcesso: `${numero}-01`,
              status: arquivada ? "ARQUIVADO" : "PROCEDENTE",
              resumo: `Disposicao: ${o.disposicao ?? "-"} (tipo ${codigoDisp})`,
            },
          },
        },
      });
      criadas += 1;
    }
    console.log(
      `ocorrencias: ${criadas} criadas (${semAluno} puladas por matricula sem cadastro).`,
    );
  }

  await prisma.$disconnect();
  console.log("OK");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
