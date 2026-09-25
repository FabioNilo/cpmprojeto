"use server";

import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";

import { prisma } from "@/db/prisma";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/lib/actions/action-state";
import { getRequestMetadata } from "@/lib/http/request-metadata";
import { registerAudit } from "@/modules/auditoria/services/audit-service";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";

import { classificarFaixa } from "../services/faixa-comportamento";
import { canonicalJson } from "../services/ficha-hash";
import { resumoPontuacao } from "../services/pontuacao";
import { carregarFaixas } from "../queries/list-comportamento";

function iso(d: Date): string {
  return d.toISOString();
}

export async function gerarFichaAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const context = await requirePermission(PERMISSIONS.FICHAS_GENERATE);
  const alunoId = String(formData.get("alunoId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(alunoId)) {
    return actionError("Aluno inválido.");
  }

  try {
    const metadata = await getRequestMetadata();

    const vinculo = await prisma.alunoVinculoColegio.findFirst({
      where: { alunoId, colegioId: context.colegioId },
      select: {
        status: true,
        aluno: { select: { nome: true, matriculaGeral: true } },
      },
    });
    if (!vinculo) {
      return actionError("Aluno sem vínculo no colégio ativo.");
    }

    const [matricula, movimentos, elogios, processos, faixas] =
      await Promise.all([
        prisma.matricula.findFirst({
          where: { alunoId, colegioId: context.colegioId, ativa: true },
          select: {
            numero: true,
            turma: { select: { nome: true } },
            anoLetivo: { select: { ano: true } },
          },
        }),
        prisma.movimentoPontuacao.findMany({
          where: { alunoId, colegioId: context.colegioId },
          orderBy: { efetivadoEm: "asc" },
          select: {
            tipo: true,
            valor: true,
            descricao: true,
            efetivadoEm: true,
          },
        }),
        prisma.elogio.findMany({
          where: { alunoId, colegioId: context.colegioId },
          orderBy: { concedidoEm: "asc" },
          select: {
            tipoElogioCodigo: true,
            valorPontos: true,
            descricao: true,
            concedidoEm: true,
          },
        }),
        prisma.ocorrenciaAluno.findMany({
          where: { alunoId, ocorrencia: { colegioId: context.colegioId } },
          orderBy: { createdAt: "asc" },
          select: {
            numeroProcesso: true,
            status: true,
            ocorrencia: {
              select: {
                numero: true,
                tipo: true,
                status: true,
                dataOcorrencia: true,
                descricao: true,
                comunicante: { select: { nome: true, posto: true } },
              },
            },
            enquadramentos: {
              where: { revogadoEm: null },
              select: {
                natureza: true,
                fundamentacao: true,
                transgressao: { select: { codigo: true, descricao: true } },
              },
            },
            decisoes: {
              where: { revogadoEm: null },
              select: {
                resultado: true,
                naturezaApurada: true,
                sancaoTipoCodigo: true,
                diasSancao: true,
                numero: true,
                fundamentacao: true,
                decididoPorPerfilCodigo: true,
              },
            },
            sancoes: {
              select: {
                tipoSancaoCodigo: true,
                dias: true,
                impactoPontos: true,
                status: true,
                numeroPublicacao: true,
                aplicadaEm: true,
              },
            },
            reconsideracoes: {
              select: { status: true, numero: true, prazoFinal: true },
            },
            afastamentos: {
              select: {
                status: true,
                diasIniciais: true,
                inicioEm: true,
                fimPrevisto: true,
              },
            },
            conselhos: {
              select: {
                numero: true,
                status: true,
                recomendacao: true,
                votosFavor: true,
                votosContra: true,
              },
            },
          },
        }),
        carregarFaixas(),
      ]);

    const resumo = resumoPontuacao(
      movimentos.map((m) => ({ valor: Number(m.valor) })),
    );
    const faixa = classificarFaixa(resumo.saldoExibido, faixas);

    const conteudoBase = {
      aluno: {
        nome: vinculo.aluno.nome,
        matriculaGeral: vinculo.aluno.matriculaGeral,
        vinculo: vinculo.status,
      },
      matricula: matricula
        ? {
            numero: matricula.numero,
            turma: matricula.turma.nome,
            ano: matricula.anoLetivo.ano,
          }
        : null,
      pontuacao: {
        saldoExibido: resumo.saldoExibido,
        saldoBruto: resumo.saldoBruto,
        faixa: faixa?.codigo ?? null,
        exigeAcompanhamento: resumo.exigeAcompanhamento,
      },
      totais: {
        processos: processos.length,
        procedentes: processos.filter((p) => p.status === "PROCEDENTE").length,
        sancoesVigentes: processos
          .flatMap((p) => p.sancoes)
          .filter((s) => s.status !== "ANULADA").length,
        elogios: elogios.length,
        elogiosPontos: elogios.reduce((soma, e) => soma + Number(e.valorPontos), 0),
      },
      processos: processos.map((p) => ({
        numeroProcesso: p.numeroProcesso,
        status: p.status,
        ocorrencia: {
          numero: p.ocorrencia.numero,
          tipo: p.ocorrencia.tipo,
          status: p.ocorrencia.status,
          data: iso(p.ocorrencia.dataOcorrencia),
          descricao: p.ocorrencia.descricao,
          comunicante: {
            nome: p.ocorrencia.comunicante.nome,
            posto: p.ocorrencia.comunicante.posto,
          },
        },
        enquadramentos: p.enquadramentos.map((e) => ({
          natureza: e.natureza,
          transgressao: e.transgressao.codigo,
          descricao: e.transgressao.descricao,
          fundamentacao: e.fundamentacao,
        })),
        decisoes: p.decisoes.map((d) => ({
          resultado: d.resultado,
          natureza: d.naturezaApurada,
          sancao: d.sancaoTipoCodigo,
          dias: d.diasSancao,
          numero: d.numero,
          perfil: d.decididoPorPerfilCodigo,
          fundamentacao: d.fundamentacao,
        })),
        sancoes: p.sancoes.map((s) => ({
          tipo: s.tipoSancaoCodigo,
          dias: s.dias,
          impacto: Number(s.impactoPontos),
          status: s.status,
          numero: s.numeroPublicacao,
          aplicadaEm: iso(s.aplicadaEm),
        })),
        reconsideracoes: p.reconsideracoes.map((r) => ({
          status: r.status,
          numero: r.numero,
          prazoFinal: iso(r.prazoFinal),
        })),
        afastamentos: p.afastamentos.map((a) => ({
          status: a.status,
          dias: a.diasIniciais,
          inicio: iso(a.inicioEm),
          fim: iso(a.fimPrevisto),
        })),
        conselhos: p.conselhos.map((c) => ({
          numero: c.numero,
          status: c.status,
          recomendacao: c.recomendacao,
          votos: `${c.votosFavor ?? 0}x${c.votosContra ?? 0}`,
        })),
      })),
      elogios: elogios.map((e) => ({
        tipo: e.tipoElogioCodigo,
        valor: Number(e.valorPontos),
        descricao: e.descricao,
        data: iso(e.concedidoEm),
      })),
      movimentos: movimentos.map((m) => ({
        tipo: m.tipo,
        valor: Number(m.valor),
        descricao: m.descricao,
        data: iso(m.efetivadoEm),
      })),
    };

    const hash = createHash("sha256")
      .update(canonicalJson(conteudoBase))
      .digest("hex");

    const maxV = await prisma.fichaDisciplinar.aggregate({
      where: { alunoId, colegioId: context.colegioId },
      _max: { versao: true },
    });
    const versao = (maxV._max.versao ?? 0) + 1;

    const conteudo = {
      ...conteudoBase,
      geradoEm: new Date().toISOString(),
      versao,
      hash,
    };

    const ficha = await prisma.$transaction(async (tx) => {
      const criada = await tx.fichaDisciplinar.create({
        data: {
          alunoId,
          colegioId: context.colegioId,
          versao,
          conteudo,
          hash,
          geradoPorId: context.usuarioId,
        },
      });
      await registerAudit(
        {
          usuarioId: context.usuarioId,
          colegioId: context.colegioId,
          acao: "GERACAO_FICHA_DISCIPLINAR",
          entidade: "fichas_disciplinares",
          entidadeId: criada.id,
          dadosNovos: { versao, hash },
          metadata,
        },
        tx,
      );
      return criada;
    });

    revalidatePath(`/disciplina/comportamento/${alunoId}`);
    return actionSuccess(
      `FAD versão ${ficha.versao} gerada (hash ${hash.slice(0, 12)}...).`,
    );
  } catch {
    return actionError("Não foi possível gerar a ficha.");
  }
}
