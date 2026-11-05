// Cria dados FICTICIOS para capturar as telas do manual do usuario.
// So roda em banco local: o manual nunca deve mostrar alunos reais.
// Uso (depois de "prisma migrate deploy" e do seed no banco local):
//   DATABASE_URL="postgresql://...@127.0.0.1:5435/...?schema=public" node scripts/manual-dados-ficticios.cjs

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const url = new URL(process.env.DATABASE_URL ?? "");
if (!["localhost", "127.0.0.1"].includes(url.hostname)) {
  throw new Error("Recusado: este script so roda em banco local.");
}

const prisma = new PrismaClient();
const SENHA = "Manual@12345";
const ANO = 2026;
const dia = (texto) => new Date(`${texto}T12:00:00Z`);

const ALUNOS = [
  ["Ana Exemplo Souza", "90001", "6º FUN A"],
  ["Bruno Ficticio Lima", "90002", "6º FUN A"],
  ["Carla Modelo Santos", "90003", "6º FUN A"],
  ["Daniel Exemplo Rocha", "90004", "9º FUN B"],
  ["Elisa Ficticia Alves", "90005", "9º FUN B"],
  ["Felipe Modelo Costa", "90006", "9º FUN B"],
  ["Gabriela Exemplo Dias", "90007", "1º MED A"],
  ["Henrique Ficticio Melo", "90008", "1º MED A"],
  ["Isabela Modelo Ramos", "90009", "1º MED A"],
  ["Jonas Exemplo Pires", "90010", "1º MED A"],
];

async function criarUsuario(colegioId, username, nome, posto, perfilCodigo) {
  const perfil = await prisma.perfil.findUniqueOrThrow({
    where: { codigo: perfilCodigo },
  });
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      posto,
      username,
      passwordHash: await bcrypt.hash(SENHA, 10),
      colegios: {
        create: {
          colegioId,
          perfis: { create: { perfilId: perfil.id } },
        },
      },
    },
  });
  return usuario;
}

async function main() {
  const colegio = await prisma.colegio.findFirstOrThrow({
    orderBy: { createdAt: "asc" },
  });
  await prisma.colegio.update({
    where: { id: colegio.id },
    data: { nome: "Colégio da Polícia Militar - Unidade Exemplo" },
  });
  const colegioId = colegio.id;

  const comando = await criarUsuario(
    colegioId,
    "demo.comando",
    "Paulo Exemplo Andrade",
    "TEN CEL PM",
    "DIRETOR_PM",
  );
  const professor = await criarUsuario(
    colegioId,
    "demo.professor",
    "Marina Ficticia Reis",
    null,
    "PROFESSOR",
  );
  const responsavelUsuario = await criarUsuario(
    colegioId,
    "demo.responsavel",
    "Rita Exemplo Souza",
    null,
    "RESPONSAVEL",
  );
  await prisma.usuario.update({
    where: { id: responsavelUsuario.id },
    data: {
      mudarSenhaObrigatoria: false,
      termoResponsavelAceitoEm: new Date(),
      termoResponsavelVersao: "2026.1",
    },
  });
  const responsavel = await prisma.responsavel.create({
    data: { usuarioId: responsavelUsuario.id, telefone: "(00) 00000-0000" },
  });

  const anoLetivo = await prisma.anoLetivo.upsert({
    where: { colegioId_ano: { colegioId, ano: ANO } },
    update: {},
    create: { colegioId, ano: ANO },
  });

  const turmas = {};
  for (const nome of new Set(ALUNOS.map((a) => a[2]))) {
    turmas[nome] = await prisma.turma.create({
      data: { colegioId, anoLetivoId: anoLetivo.id, nome, turno: "Matutino" },
    });
  }

  const alunos = [];
  for (const [nome, matriculaGeral, turmaNome] of ALUNOS) {
    const aluno = await prisma.aluno.create({
      data: { nome, matriculaGeral },
    });
    const vinculo = await prisma.alunoVinculoColegio.create({
      data: { alunoId: aluno.id, colegioId, dataEntrada: dia("2026-02-02") },
    });
    await prisma.matricula.create({
      data: {
        alunoId: aluno.id,
        colegioId,
        alunoVinculoColegioId: vinculo.id,
        turmaId: turmas[turmaNome].id,
        anoLetivoId: anoLetivo.id,
      },
    });
    alunos.push(aluno);
  }

  await prisma.alunoResponsavel.create({
    data: {
      alunoId: alunos[0].id,
      responsavelId: responsavel.id,
      parentesco: "Mãe",
      principal: true,
    },
  });

  const transgressao = await prisma.transgressao.findFirstOrThrow({
    where: { natureza: "LEVE" },
  });
  const codigo = colegio.codigo;
  let seq = 0;

  async function ocorrencia(aluno, descricao, status, statusProcesso, data) {
    seq += 1;
    const numero = `${codigo}/${ANO}/${String(seq).padStart(4, "0")}`;
    const criada = await prisma.ocorrencia.create({
      data: {
        colegioId,
        comunicanteId: professor.id,
        status,
        numero,
        sequencial: seq,
        anoNumeracao: ANO,
        dataOcorrencia: dia(data),
        local: "Sala de aula",
        descricao,
        enviadaEm: dia(data),
        alunos: {
          create: {
            alunoId: aluno.id,
            ordem: 1,
            numeroProcesso: numero,
            numeroSequencial: seq,
            anoNumeracao: ANO,
            status: statusProcesso,
          },
        },
      },
      include: { alunos: true },
    });
    return criada.alunos[0];
  }

  async function sancionar(processo, aluno, tipoCodigo, impacto, data) {
    seq += 1;
    await prisma.enquadramentoDisciplinar.create({
      data: {
        ocorrenciaAlunoId: processo.id,
        transgressaoId: transgressao.id,
        natureza: "LEVE",
        fundamentacao: "Fundamentação fictícia para o manual.",
        registradoPorId: comando.id,
      },
    });
    const decisao = await prisma.decisao.create({
      data: {
        ocorrenciaAlunoId: processo.id,
        resultado: "PROCEDENTE",
        naturezaApurada: "LEVE",
        sancaoTipoCodigo: tipoCodigo,
        fundamentacao: "Decisão fictícia para o manual.",
        decididoPorId: comando.id,
        decididoPorPerfilCodigo: "DIRETOR_PM",
        numero: `${codigo}-DEC/${ANO}/${String(seq).padStart(4, "0")}`,
        sequencial: seq,
        anoNumeracao: ANO,
      },
    });
    const sancao = await prisma.sancao.create({
      data: {
        ocorrenciaAlunoId: processo.id,
        decisaoId: decisao.id,
        tipoSancaoCodigo: tipoCodigo,
        impactoPontos: impacto,
        numeroPublicacao: `${codigo}-BI/${ANO}/${String(seq).padStart(4, "0")}`,
        sequencial: seq,
        anoNumeracao: ANO,
        aplicadaPorId: comando.id,
        aplicadaEm: dia(data),
      },
    });
    await prisma.movimentoPontuacao.create({
      data: {
        alunoId: aluno.id,
        colegioId,
        tipo: "SANCAO",
        valor: impacto,
        origemTipo: "sancao",
        origemId: sancao.id,
        descricao: `Sanção ${tipoCodigo} (${sancao.numeroPublicacao})`,
        registradoPorId: comando.id,
        efetivadoEm: dia(data),
      },
    });
    return sancao;
  }

  // Processo aberto da aluna vinculada a responsavel ficticia (portal).
  await ocorrencia(
    alunos[0],
    "Uso inadequado do uniforme no horário de entrada.",
    "AGUARDANDO_MANIFESTACAO",
    "PENDENTE",
    "2026-09-02",
  );
  await ocorrencia(
    alunos[3],
    "Chegou atrasado à formatura sem justificativa.",
    "EM_ANALISE",
    "PENDENTE",
    "2026-09-10",
  );
  await ocorrencia(
    alunos[6],
    "Deixou de realizar a tarefa atribuída pelo professor.",
    "EM_AVERIGUACAO",
    "PENDENTE",
    "2026-09-15",
  );

  // Aluno com historico: aparece no extrato, na lista e no painel.
  const historico = [
    ["Portou-se de forma inconveniente em sala de aula.", "ADVERTENCIA", -0.1, "2026-03-10"],
    ["Chegou atrasado à atividade escolar.", "REPREENSAO", -0.2, "2026-04-14"],
    ["Deixou de cumprir determinação em instrução.", "SUSPENSAO_SEM_PREJUIZO", -0.3, "2026-05-20"],
  ];
  let ultimaSancao = null;
  let ultimoProcesso = null;
  for (const [texto, tipo, impacto, data] of historico) {
    const processo = await ocorrencia(alunos[4], texto, "DECIDIDA", "PROCEDENTE", data);
    ultimaSancao = await sancionar(processo, alunos[4], tipo, impacto, data);
    ultimoProcesso = processo;
  }

  const sancaoGrande = await ocorrencia(
    alunos[7],
    "Desrespeitou colega durante a instrução.",
    "DECIDIDA",
    "PROCEDENTE",
    "2026-06-02",
  );
  await sancionar(sancaoGrande, alunos[7], "SUSPENSAO_COM_PREJUIZO", -2.5, "2026-06-02");

  // Reconsideracao pendente para a fila.
  await prisma.reconsideracao.create({
    data: {
      sancaoId: ultimaSancao.id,
      ocorrenciaAlunoId: ultimoProcesso.id,
      solicitanteId: comando.id,
      texto: "Pedido fictício de reconsideração para o manual.",
      prazoFinal: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const tipoElogio = await prisma.tipoElogio.findFirstOrThrow();
  await prisma.elogio.create({
    data: {
      alunoId: alunos[8].id,
      colegioId,
      tipoElogioCodigo: tipoElogio.codigo,
      valorPontos: tipoElogio.valorPontos,
      descricao: "Elogio fictício para o manual.",
      registradoPorId: comando.id,
    },
  });
  await prisma.movimentoPontuacao.create({
    data: {
      alunoId: alunos[8].id,
      colegioId,
      tipo: "ELOGIO",
      valor: tipoElogio.valorPontos,
      origemTipo: "elogio",
      descricao: "Elogio fictício para o manual.",
      registradoPorId: comando.id,
    },
  });

  console.log(`Dados ficticios criados. Senha das contas demo: ${SENHA}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
