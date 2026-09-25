import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/security/password";
import { PERMISSIONS, ROLE_CODES } from "../src/modules/rbac/permissions";
import {
  ROLE_DEFINITIONS,
  ROLE_PERMISSION_MATRIX,
} from "../src/modules/rbac/role-permission-matrix";

const prisma = new PrismaClient();

const permissionDefinitions = [
  {
    codigo: PERMISSIONS.DASHBOARD_ACCESS,
    nome: "Acessar dashboard",
    descricao: "Permite acessar a area inicial autenticada.",
  },
  {
    codigo: PERMISSIONS.COLEGIOS_MANAGE,
    nome: "Gerenciar colegios",
    descricao: "Permite administrar colegios.",
  },
  {
    codigo: PERMISSIONS.USUARIOS_MANAGE,
    nome: "Gerenciar usuarios",
    descricao: "Permite administrar usuarios.",
  },
  {
    codigo: PERMISSIONS.RBAC_MANAGE,
    nome: "Gerenciar perfis e permissoes",
    descricao: "Permite administrar autorizacoes.",
  },
  {
    codigo: PERMISSIONS.ALUNOS_READ,
    nome: "Consultar alunos",
    descricao: "Permite consultar cadastros de alunos.",
  },
  {
    codigo: PERMISSIONS.ALUNOS_MANAGE,
    nome: "Gerenciar alunos",
    descricao: "Permite administrar cadastros de alunos.",
  },
  {
    codigo: PERMISSIONS.ALUNOS_TRANSFER,
    nome: "Transferir alunos entre CPMs",
    descricao:
      "Permite transferir aluno do CPM de origem para outro CPM, preservando matricula geral e historico.",
  },
  {
    codigo: PERMISSIONS.RESPONSAVEIS_READ,
    nome: "Consultar responsaveis",
    descricao: "Permite consultar responsaveis vinculados aos alunos.",
  },
  {
    codigo: PERMISSIONS.RESPONSAVEIS_MANAGE,
    nome: "Gerenciar responsaveis",
    descricao: "Permite administrar cadastros de responsaveis.",
  },
  {
    codigo: PERMISSIONS.TURMAS_READ,
    nome: "Consultar turmas",
    descricao: "Permite consultar turmas e matriculas.",
  },
  {
    codigo: PERMISSIONS.TURMAS_MANAGE,
    nome: "Gerenciar turmas",
    descricao: "Permite administrar turmas e matriculas.",
  },
  {
    codigo: PERMISSIONS.ANOS_LETIVOS_MANAGE,
    nome: "Gerenciar anos letivos",
    descricao: "Permite abrir e encerrar anos letivos do colegio.",
  },
  {
    codigo: PERMISSIONS.MATRICULAS_READ,
    nome: "Consultar matriculas",
    descricao: "Permite consultar matriculas de alunos por turma e ano.",
  },
  {
    codigo: PERMISSIONS.MATRICULAS_MANAGE,
    nome: "Gerenciar matriculas",
    descricao:
      "Permite matricular, transferir de turma, cancelar e reativar matriculas.",
  },
  {
    codigo: PERMISSIONS.DISCIPLINA_CATALOGOS_READ,
    nome: "Consultar catalogos disciplinares",
    descricao:
      "Permite consultar transgressoes, atenuantes, agravantes, sancoes, faixas, competencias e prazos.",
  },
  {
    codigo: PERMISSIONS.DISCIPLINA_CATALOGOS_MANAGE,
    nome: "Gerenciar catalogos disciplinares",
    descricao:
      "Permite manter os catalogos parametrizaveis do modulo disciplinar.",
  },
  {
    codigo: PERMISSIONS.OCORRENCIAS_CREATE,
    nome: "Comunicar ocorrencia",
    descricao: "Permite registrar a comunicacao de um fato disciplinar.",
  },
  {
    codigo: PERMISSIONS.OCORRENCIAS_READ_OWN,
    nome: "Consultar minhas ocorrencias",
    descricao: "Permite consultar as ocorrencias que o proprio usuario comunicou.",
  },
  {
    codigo: PERMISSIONS.OCORRENCIAS_READ_SCHOOL,
    nome: "Consultar ocorrencias do colegio",
    descricao: "Permite consultar todas as ocorrencias do colegio ativo.",
  },
  {
    codigo: PERMISSIONS.OCORRENCIAS_MANAGE,
    nome: "Conduzir ocorrencias",
    descricao:
      "Permite averiguar, editar e arquivar ocorrencias do colegio ativo.",
  },
  {
    codigo: PERMISSIONS.MANIFESTACOES_CREATE,
    nome: "Registrar manifestacao",
    descricao:
      "Permite registrar manifestacao/justificacao do aluno ou responsavel.",
  },
  {
    codigo: PERMISSIONS.MANIFESTACOES_AVALIAR,
    nome: "Avaliar manifestacao",
    descricao:
      "Permite acolher ou indeferir a justificativa apresentada no processo.",
  },
  {
    codigo: PERMISSIONS.CIENCIAS_CONFIRM,
    nome: "Confirmar ciencia",
    descricao: "Permite registrar formalmente a ciencia do responsavel.",
  },
  {
    codigo: PERMISSIONS.ENQUADRAMENTOS_MANAGE,
    nome: "Enquadrar transgressoes",
    descricao:
      "Permite registrar e revogar o enquadramento do fato numa transgressao.",
  },
  {
    codigo: PERMISSIONS.DECISOES_REGISTER,
    nome: "Registrar decisao disciplinar",
    descricao:
      "Permite decidir o processo (procedente/improcedente/arquivado) respeitando a competencia.",
  },
  {
    codigo: PERMISSIONS.SANCOES_APPLY,
    nome: "Aplicar sancao",
    descricao:
      "Permite aplicar, cumprir, suspender efeitos e anular sancoes, lancando os movimentos de pontuacao.",
  },
  {
    codigo: PERMISSIONS.RECONSIDERACOES_CREATE,
    nome: "Solicitar reconsideracao",
    descricao:
      "Permite pedir reconsideracao de uma sancao dentro do prazo de 15 dias.",
  },
  {
    codigo: PERMISSIONS.RECONSIDERACOES_DECIDE,
    nome: "Decidir reconsideracao",
    descricao:
      "Permite deferir ou indeferir pedidos de reconsideracao conforme a competencia.",
  },
  {
    codigo: PERMISSIONS.AFASTAMENTOS_MANAGE,
    nome: "Gerir afastamento cautelar",
    descricao:
      "Permite determinar, prorrogar e encerrar afastamento cautelar (nao e sancao).",
  },
  {
    codigo: PERMISSIONS.SINDICANCIAS_MANAGE,
    nome: "Gerir sindicancia",
    descricao: "Permite instaurar, acompanhar e concluir sindicancias.",
  },
  {
    codigo: PERMISSIONS.CONSELHOS_MANAGE,
    nome: "Gerir conselho disciplinar",
    descricao: "Permite instaurar conselho disciplinar e registrar o parecer.",
  },
  {
    codigo: PERMISSIONS.ELOGIOS_REGISTER,
    nome: "Registrar elogio",
    descricao: "Permite conceder elogios que somam pontos ao comportamento.",
  },
  {
    codigo: PERMISSIONS.PONTUACAO_MANAGE,
    nome: "Gerir pontuacao",
    descricao:
      "Permite ajuste administrativo de pontos e o processamento das restauracoes anuais.",
  },
  {
    codigo: PERMISSIONS.COMPORTAMENTO_READ,
    nome: "Consultar comportamento",
    descricao: "Permite consultar saldo, faixa e extrato de comportamento dos alunos.",
  },
  {
    codigo: PERMISSIONS.FICHAS_GENERATE,
    nome: "Gerar Ficha Disciplinar (FAD)",
    descricao:
      "Permite gerar snapshots versionados e assinados por hash da ficha disciplinar do aluno.",
  },
  {
    codigo: PERMISSIONS.ANEXOS_MANAGE,
    nome: "Gerir anexos",
    descricao:
      "Permite enviar e remover anexos (documentos e imagens) das ocorrencias.",
  },
  {
    codigo: PERMISSIONS.AUDITORIA_READ,
    nome: "Consultar auditoria",
    descricao: "Permite consultar registros de auditoria.",
  },
  {
    codigo: PERMISSIONS.TENANCY_SWITCH,
    nome: "Trocar colegio ativo",
    descricao:
      "Permite alternar o contexto ativo entre CPMs vinculados ao usuario.",
  },
];

// D1 - catalogos disciplinares (globais). Fonte: anexoA.txt.
const tiposSancao = [
  { codigo: "IMPEDIMENTO", nome: "Impedimento", ordem: 1, impactoPontos: "0", geraAfastamento: false, ehDesligamento: false },
  { codigo: "ADVERTENCIA", nome: "Advertencia", ordem: 2, impactoPontos: "-0.10", geraAfastamento: false, ehDesligamento: false },
  { codigo: "REPREENSAO", nome: "Repreensao", ordem: 3, impactoPontos: "-0.20", geraAfastamento: false, ehDesligamento: false },
  { codigo: "SUSPENSAO_SEM_PREJUIZO", nome: "Suspensao sem prejuizo", ordem: 4, impactoPontos: "-0.30", geraAfastamento: true, ehDesligamento: false },
  { codigo: "SUSPENSAO_COM_PREJUIZO", nome: "Suspensao com prejuizo", ordem: 5, impactoPontos: "-0.50", geraAfastamento: true, ehDesligamento: false },
  { codigo: "TRANSFERENCIA_COMPULSORIA", nome: "Transferencia compulsoria", ordem: 6, impactoPontos: "0", geraAfastamento: true, ehDesligamento: true },
];

// anexoA nao enumera elogios; valores de exemplo ate o Regimento definir.
const tiposElogio = [
  { codigo: "ELOGIO_INDIVIDUAL", nome: "Elogio individual", valorPontos: "0.10" },
  { codigo: "ELOGIO_COLETIVO", nome: "Elogio coletivo", valorPontos: "0.05" },
  { codigo: "DESTAQUE_DISCIPLINAR", nome: "Destaque disciplinar", valorPontos: "0.20" },
  { codigo: "MENCAO_HONROSA", nome: "Mencao honrosa", valorPontos: "0.30" },
];

const faixasComportamento = [
  { codigo: "EXCEPCIONAL", nome: "Excepcional", limiteInferior: "10.00", limiteSuperior: "10.00", ordem: 1, exigeAcompanhamento: false },
  { codigo: "OTIMO", nome: "Otimo", limiteInferior: "9.00", limiteSuperior: "9.99", ordem: 2, exigeAcompanhamento: false },
  { codigo: "BOM", nome: "Bom", limiteInferior: "7.00", limiteSuperior: "8.99", ordem: 3, exigeAcompanhamento: false },
  { codigo: "REGULAR", nome: "Regular", limiteInferior: "5.00", limiteSuperior: "6.99", ordem: 4, exigeAcompanhamento: true },
  { codigo: "INSUFICIENTE", nome: "Insuficiente", limiteInferior: "2.00", limiteSuperior: "4.99", ordem: 5, exigeAcompanhamento: true },
  { codigo: "INCOMPATIVEL", nome: "Incompativel", limiteInferior: "0.00", limiteSuperior: "1.99", ordem: 6, exigeAcompanhamento: true },
];

const competenciasDisciplinares = [
  { perfilCodigo: ROLE_CODES.COMANDANTE_PELOTAO, tipoAto: "APLICAR_SANCAO", tipoSancaoMaxCodigo: "SUSPENSAO_SEM_PREJUIZO", diasMax: null, naturezaMax: null },
  { perfilCodigo: ROLE_CODES.COMANDANTE_COMPANHIA, tipoAto: "APLICAR_SANCAO", tipoSancaoMaxCodigo: "SUSPENSAO_SEM_PREJUIZO", diasMax: 3, naturezaMax: null },
  { perfilCodigo: ROLE_CODES.CHEFE_CORPO_ALUNOS, tipoAto: "APLICAR_SANCAO", tipoSancaoMaxCodigo: "SUSPENSAO_COM_PREJUIZO", diasMax: 5, naturezaMax: null },
  { perfilCodigo: ROLE_CODES.DIRETOR_PM, tipoAto: "APLICAR_SANCAO", tipoSancaoMaxCodigo: "TRANSFERENCIA_COMPULSORIA", diasMax: null, naturezaMax: null },
  { perfilCodigo: ROLE_CODES.CHEFE_CORPO_ALUNOS, tipoAto: "DECIDIR_RECONSIDERACAO", tipoSancaoMaxCodigo: null, diasMax: null, naturezaMax: "LEVE" as const },
  { perfilCodigo: ROLE_CODES.DIRETOR_ADJUNTO, tipoAto: "DECIDIR_RECONSIDERACAO", tipoSancaoMaxCodigo: null, diasMax: null, naturezaMax: "MEDIA" as const },
  { perfilCodigo: ROLE_CODES.DIRETOR_PM, tipoAto: "DECIDIR_RECONSIDERACAO", tipoSancaoMaxCodigo: null, diasMax: null, naturezaMax: "ELIMINATORIA" as const },
];

const prazosProcessuais = [
  { codigo: "JUSTIFICACAO_FALTA_ATRASO", nome: "Justificacao de falta/atraso escolar", quantidade: 48, unidade: "HORAS", descricao: "Prazo do regulamento para comunicar/justificar falta escolar e atraso escolar. Nao usar como prazo generico." },
  { codigo: "RECONSIDERACAO", nome: "Pedido de reconsideracao", quantidade: 15, unidade: "DIAS_CORRIDOS", descricao: "Prazo apos a ciencia/publicacao da sancao." },
  { codigo: "AFASTAMENTO_CAUTELAR", nome: "Afastamento cautelar", quantidade: 5, unidade: "DIAS_LETIVOS", descricao: "Prazo maximo inicial determinado pelo Diretor PM." },
  { codigo: "AFASTAMENTO_CAUTELAR_PRORROGACAO", nome: "Prorrogacao do afastamento cautelar", quantidade: 5, unidade: "DIAS_LETIVOS", descricao: "Uma unica prorrogacao por igual periodo." },
];

const atenuantes = [
  { codigo: "NOVATO_2_MESES", descricao: "Aluno novato nos primeiros 2 meses" },
  { codigo: "COMPORTAMENTO_OTIMO_EXCEPCIONAL", descricao: "Comportamento OTIMO ou EXCEPCIONAL" },
  { codigo: "PRIMEIRA_FALTA", descricao: "Primeira falta" },
  { codigo: "FALTA_DE_PRATICA", descricao: "Falta de pratica" },
  { codigo: "SERVICOS_RELEVANTES", descricao: "Servicos relevantes prestados" },
  { codigo: "ACAO_EVITAR_MAL_MAIOR", descricao: "Acao para evitar mal maior" },
];

// Catalogo de transgressoes. As LEVE/MEDIA (L*/M*) vem da analise de
// frequencia do bancoFad real (2774 ocorrencias do CPM Romulo Galvao, campo
// livre OCOR) - cobrem ~77% dos casos historicos, varias sao incisos
// literais do RDCPM. E' HEURISTICA: a natureza (LEVE/MEDIA) foi inferida pela
// disposicao mais comum aplicada a cada motivo no historico, nao pelo texto
// oficial do Regimento (que ainda nao foi fornecido) - revisar quando ele
// chegar. GRAVE/ELIMINATORIA (G*/E01) nao apareceram no historico (nenhum
// caso desse porte no periodo analisado) e continuam exemplos ilustrativos,
// mantidos so para exercitar o fluxo de enquadramento/competencia em D4.
const BASE_LEGAL_HEURISTICA =
  "Baseado em analise de frequencia do bancoFad - provisorio ate Regimento oficial";
const BASE_LEGAL_EXEMPLO = "Exemplo - substituir pelo Regimento CPM-BA 2026";
const transgressoes = [
  { codigo: "L01", descricao: "Chegou atrasado a formatura ou atividade escolar sem justificativa", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L02", descricao: "Faltou a atividade pedagogica sem justificativa", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L03", descricao: "Deixou de realizar tarefa atribuida pelo professor ou coordenador", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L04", descricao: "Portou-se de forma inconveniente em sala de aula ou outro local de instrucao", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L05", descricao: "Compareceu para a pratica de Educacao Fisica sem o uniforme regulamentar", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L06", descricao: "Deixou de trazer material pedagogico para a sala de aula", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L07", descricao: "Compareceu com alteracao no uniforme regulamentar", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L08", descricao: "Permaneceu fora da sala de aula durante o horario de instrucao sem autorizacao", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L09", descricao: "Apresentou-se com o cabelo fora do padrao do RDCPM", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L10", descricao: "Saiu da sala de aula sem permissao da autoridade competente", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L11", descricao: "Ingressou ou saiu do CPM sem estar com o fardamento regulamentar (RDCPM, inciso XLV)", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L12", descricao: "Deixou de cumprir norma emanada pela Unidade Discente", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L13", descricao: "Utilizou adorno nao permitido pelo RDCPM", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L14", descricao: "Usou o fardamento faltando peca regulamentar - cinto, sapato, coturno, boina ou distintivo (RDCPM, inciso XVII)", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "L15", descricao: "Conversou ou se movimentou estando em forma (RDCPM, inciso VII)", natureza: "LEVE" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "M01", descricao: "Utilizou aparelho sonoro ou dispositivo movel durante atividade pedagogica sem autorizacao", natureza: "MEDIA" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "M02", descricao: "Deixou de dispensar tratamento respeitoso a militar, professor ou servidor", natureza: "MEDIA" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "M03", descricao: "Praticou irregularidade em avaliacao por consulta indevida a material nao autorizado", natureza: "MEDIA" as const, baseLegal: BASE_LEGAL_HEURISTICA },
  { codigo: "G01", descricao: "Praticar ato de agressao fisica contra colega", natureza: "GRAVE" as const, baseLegal: BASE_LEGAL_EXEMPLO },
  { codigo: "G02", descricao: "Falsificar documento ou assinatura", natureza: "GRAVE" as const, baseLegal: BASE_LEGAL_EXEMPLO },
  { codigo: "G03", descricao: "Portar ou utilizar substancia proibida no ambiente escolar", natureza: "GRAVE" as const, baseLegal: BASE_LEGAL_EXEMPLO },
  { codigo: "E01", descricao: "Praticar ato incompativel com a condicao de aluno do CPM que inviabilize a permanencia", natureza: "ELIMINATORIA" as const, baseLegal: BASE_LEGAL_EXEMPLO },
];

const agravantes = [
  { codigo: "ALUNO_GRADUADO", descricao: "Aluno graduado" },
  { codigo: "ALUNO_XERIFE", descricao: "Aluno xerife" },
  { codigo: "COMPORTAMENTO_INSUFICIENTE_INCOMPATIVEL", descricao: "Comportamento INSUFICIENTE ou INCOMPATIVEL" },
  { codigo: "FALTA_EM_SERVICO_AULA_INSTRUCAO", descricao: "Falta durante servico, aula ou instrucao" },
  { codigo: "REINCIDENCIA_3_ANOS", descricao: "Reincidencia da mesma falta em ate 3 anos" },
  { codigo: "MULTIPLAS_FALTAS_RELACIONADAS", descricao: "Multiplas faltas relacionadas" },
  { codigo: "CONLUIO_ENTRE_ALUNOS", descricao: "Conluio entre alunos" },
  { codigo: "ABUSO_DE_AUTORIDADE", descricao: "Abuso de autoridade" },
  { codigo: "FALTA_EM_PUBLICO", descricao: "Falta praticada em publico" },
  { codigo: "PREMEDITACAO", descricao: "Premeditacao" },
];

async function seedCatalogosDisciplinares() {
  for (const tipo of tiposSancao) {
    await prisma.tipoSancao.upsert({
      where: { codigo: tipo.codigo },
      update: {
        nome: tipo.nome,
        ordem: tipo.ordem,
        impactoPontos: tipo.impactoPontos,
        geraAfastamento: tipo.geraAfastamento,
        ehDesligamento: tipo.ehDesligamento,
      },
      create: tipo,
    });
  }

  for (const tipo of tiposElogio) {
    await prisma.tipoElogio.upsert({
      where: { codigo: tipo.codigo },
      update: { nome: tipo.nome, valorPontos: tipo.valorPontos },
      create: tipo,
    });
  }

  for (const faixa of faixasComportamento) {
    await prisma.faixaComportamento.upsert({
      where: { codigo: faixa.codigo },
      update: {
        nome: faixa.nome,
        limiteInferior: faixa.limiteInferior,
        limiteSuperior: faixa.limiteSuperior,
        ordem: faixa.ordem,
        exigeAcompanhamento: faixa.exigeAcompanhamento,
      },
      create: faixa,
    });
  }

  for (const competencia of competenciasDisciplinares) {
    await prisma.competenciaDisciplinar.upsert({
      where: {
        perfilCodigo_tipoAto: {
          perfilCodigo: competencia.perfilCodigo,
          tipoAto: competencia.tipoAto,
        },
      },
      update: {
        tipoSancaoMaxCodigo: competencia.tipoSancaoMaxCodigo,
        diasMax: competencia.diasMax,
        naturezaMax: competencia.naturezaMax,
      },
      create: competencia,
    });
  }

  for (const prazo of prazosProcessuais) {
    await prisma.prazoProcessual.upsert({
      where: { codigo: prazo.codigo },
      update: {
        nome: prazo.nome,
        quantidade: prazo.quantidade,
        unidade: prazo.unidade,
        descricao: prazo.descricao,
      },
      create: prazo,
    });
  }

  for (const atenuante of atenuantes) {
    await prisma.atenuante.upsert({
      where: { codigo: atenuante.codigo },
      update: { descricao: atenuante.descricao },
      create: atenuante,
    });
  }

  for (const agravante of agravantes) {
    await prisma.agravante.upsert({
      where: { codigo: agravante.codigo },
      update: { descricao: agravante.descricao },
      create: agravante,
    });
  }

  for (const transgressao of transgressoes) {
    await prisma.transgressao.upsert({
      where: { codigo: transgressao.codigo },
      update: {
        descricao: transgressao.descricao,
        natureza: transgressao.natureza,
        baseLegal: transgressao.baseLegal,
      },
      create: transgressao,
    });
  }
}

async function main() {
  await seedCatalogosDisciplinares();

  const colegio = await prisma.colegio.upsert({
    where: { codigo: "CPM-BA-SEDE" },
    update: {},
    create: {
      codigo: "CPM-BA-SEDE",
      nome: "Colegio da Policia Militar - Unidade Sede",
    },
  });

  const colegioNorte = await prisma.colegio.upsert({
    where: { codigo: "CPM-BA-NORTE" },
    update: {},
    create: {
      codigo: "CPM-BA-NORTE",
      nome: "Colegio da Policia Militar - Unidade Norte",
    },
  });

  for (const permission of permissionDefinitions) {
    await prisma.permissao.upsert({
      where: { codigo: permission.codigo },
      update: {
        nome: permission.nome,
        descricao: permission.descricao,
      },
      create: permission,
    });
  }

  for (const role of ROLE_DEFINITIONS) {
    await prisma.perfil.upsert({
      where: { codigo: role.codigo },
      update: { nome: role.nome },
      create: {
        codigo: role.codigo,
        nome: role.nome,
        sistema: true,
      },
    });
  }

  for (const [roleCode, permissionCodes] of Object.entries(
    ROLE_PERMISSION_MATRIX,
  )) {
    const role = await prisma.perfil.findUniqueOrThrow({
      where: { codigo: roleCode },
    });

    const permissions = await prisma.permissao.findMany({
      where: { codigo: { in: permissionCodes } },
    });

    // Para perfis de sistema a matriz e sempre reconciliada de forma ADITIVA:
    // permissoes novas de fases futuras entram no re-seed, mas nada e removido
    // (edicoes feitas em /rbac que adicionam permissoes sao preservadas).
    // Perfis personalizados (sistema=false) nao aparecem na matriz e ficam
    // 100% sob controle da administracao.
    await prisma.perfilPermissao.createMany({
      data: permissions.map((permission) => ({
        perfilId: role.id,
        permissaoId: permission.id,
      })),
      skipDuplicates: true,
    });
  }

  const admin = await prisma.usuario.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nome: "Administrador CPM",
      username: "admin",
      email: "admin@cpm.local",
      cpf: "00000000000",
      passwordHash: await hashPassword("Admin@12345"),
    },
  });

  const adminVinculo = await prisma.usuarioColegio.upsert({
    where: {
      usuarioId_colegioId: {
        usuarioId: admin.id,
        colegioId: colegio.id,
      },
    },
    update: { ativo: true },
    create: {
      usuarioId: admin.id,
      colegioId: colegio.id,
    },
  });

  const adminRole = await prisma.perfil.findUniqueOrThrow({
    where: { codigo: ROLE_CODES.ADMINISTRADOR },
  });

  const diretorPmRole = await prisma.perfil.findUniqueOrThrow({
    where: { codigo: ROLE_CODES.DIRETOR_PM },
  });

  await prisma.usuarioColegioPerfil.upsert({
    where: {
      usuarioColegioId_perfilId: {
        usuarioColegioId: adminVinculo.id,
        perfilId: adminRole.id,
      },
    },
    update: {},
    create: {
      usuarioColegioId: adminVinculo.id,
      perfilId: adminRole.id,
    },
  });

  const adminVinculoNorte = await prisma.usuarioColegio.upsert({
    where: {
      usuarioId_colegioId: {
        usuarioId: admin.id,
        colegioId: colegioNorte.id,
      },
    },
    update: { ativo: true },
    create: {
      usuarioId: admin.id,
      colegioId: colegioNorte.id,
    },
  });

  await prisma.usuarioColegioPerfil.upsert({
    where: {
      usuarioColegioId_perfilId: {
        usuarioColegioId: adminVinculoNorte.id,
        perfilId: adminRole.id,
      },
    },
    update: {},
    create: {
      usuarioColegioId: adminVinculoNorte.id,
      perfilId: adminRole.id,
    },
  });

  const diretor = await prisma.usuario.upsert({
    where: { username: "diretor" },
    update: {},
    create: {
      nome: "Diretor PM Exemplo",
      username: "diretor",
      email: "diretor@cpm.local",
      cpf: "22222222222",
      passwordHash: await hashPassword("Diretor@12345"),
    },
  });

  for (const colegioDiretor of [colegio, colegioNorte]) {
    const diretorVinculo = await prisma.usuarioColegio.upsert({
      where: {
        usuarioId_colegioId: {
          usuarioId: diretor.id,
          colegioId: colegioDiretor.id,
        },
      },
      update: { ativo: true },
      create: {
        usuarioId: diretor.id,
        colegioId: colegioDiretor.id,
      },
    });

    await prisma.usuarioColegioPerfil.upsert({
      where: {
        usuarioColegioId_perfilId: {
          usuarioColegioId: diretorVinculo.id,
          perfilId: diretorPmRole.id,
        },
      },
      update: {},
      create: {
        usuarioColegioId: diretorVinculo.id,
        perfilId: diretorPmRole.id,
      },
    });
  }

  const anoLetivo = await prisma.anoLetivo.upsert({
    where: {
      colegioId_ano: {
        colegioId: colegio.id,
        ano: 2026,
      },
    },
    update: { ativo: true },
    create: {
      colegioId: colegio.id,
      ano: 2026,
    },
  });

  const turma = await prisma.turma.upsert({
    where: {
      colegioId_anoLetivoId_nome: {
        colegioId: colegio.id,
        anoLetivoId: anoLetivo.id,
        nome: "6A",
      },
    },
    update: { ativa: true },
    create: {
      colegioId: colegio.id,
      anoLetivoId: anoLetivo.id,
      nome: "6A",
      turno: "Matutino",
    },
  });

  const anoLetivoNorte = await prisma.anoLetivo.upsert({
    where: {
      colegioId_ano: {
        colegioId: colegioNorte.id,
        ano: 2026,
      },
    },
    update: { ativo: true },
    create: {
      colegioId: colegioNorte.id,
      ano: 2026,
    },
  });

  await prisma.turma.upsert({
    where: {
      colegioId_anoLetivoId_nome: {
        colegioId: colegioNorte.id,
        anoLetivoId: anoLetivoNorte.id,
        nome: "6A",
      },
    },
    update: { ativa: true },
    create: {
      colegioId: colegioNorte.id,
      anoLetivoId: anoLetivoNorte.id,
      nome: "6A",
      turno: "Matutino",
    },
  });

  const aluno = await prisma.aluno.upsert({
    where: {
      matriculaGeral: "20260001",
    },
    update: { ativo: true },
    create: {
      nome: "Aluno Exemplo",
      matriculaGeral: "20260001",
    },
  });

  const alunoVinculoColegio = await prisma.alunoVinculoColegio.upsert({
    where: {
      alunoId_colegioId: {
        alunoId: aluno.id,
        colegioId: colegio.id,
      },
    },
    update: { status: "ATIVO" },
    create: {
      alunoId: aluno.id,
      colegioId: colegio.id,
      status: "ATIVO",
      dataEntrada: new Date("2026-02-01T00:00:00.000Z"),
    },
  });

  await prisma.matricula.upsert({
    where: {
      alunoId_colegioId_anoLetivoId: {
        alunoId: aluno.id,
        colegioId: colegio.id,
        anoLetivoId: anoLetivo.id,
      },
    },
    update: {
      turmaId: turma.id,
      alunoVinculoColegioId: alunoVinculoColegio.id,
      ativa: true,
    },
    create: {
      alunoId: aluno.id,
      colegioId: colegio.id,
      alunoVinculoColegioId: alunoVinculoColegio.id,
      turmaId: turma.id,
      anoLetivoId: anoLetivo.id,
      numero: "001",
    },
  });

  const responsavelUsuario = await prisma.usuario.upsert({
    where: { username: "responsavel" },
    update: {},
    create: {
      nome: "Responsavel Exemplo",
      username: "responsavel",
      email: "responsavel@cpm.local",
      cpf: "11111111111",
      passwordHash: await hashPassword("Responsavel@12345"),
    },
  });

  const responsavelVinculo = await prisma.usuarioColegio.upsert({
    where: {
      usuarioId_colegioId: {
        usuarioId: responsavelUsuario.id,
        colegioId: colegio.id,
      },
    },
    update: { ativo: true },
    create: {
      usuarioId: responsavelUsuario.id,
      colegioId: colegio.id,
    },
  });

  const responsavelRole = await prisma.perfil.findUniqueOrThrow({
    where: { codigo: ROLE_CODES.RESPONSAVEL },
  });

  await prisma.usuarioColegioPerfil.upsert({
    where: {
      usuarioColegioId_perfilId: {
        usuarioColegioId: responsavelVinculo.id,
        perfilId: responsavelRole.id,
      },
    },
    update: {},
    create: {
      usuarioColegioId: responsavelVinculo.id,
      perfilId: responsavelRole.id,
    },
  });

  const responsavel = await prisma.responsavel.upsert({
    where: { usuarioId: responsavelUsuario.id },
    update: { telefone: "(71) 99999-0000" },
    create: {
      usuarioId: responsavelUsuario.id,
      telefone: "(71) 99999-0000",
    },
  });

  await prisma.alunoResponsavel.upsert({
    where: {
      alunoId_responsavelId: {
        alunoId: aluno.id,
        responsavelId: responsavel.id,
      },
    },
    update: {
      principal: true,
      parentesco: "Responsavel legal",
    },
    create: {
      alunoId: aluno.id,
      responsavelId: responsavel.id,
      principal: true,
      parentesco: "Responsavel legal",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
