import Link from "next/link";

import { FormSection } from "@/components/forms/form-section";
import { AdminPage } from "@/components/layout/admin-page";
import { NovaOcorrenciaForm } from "@/modules/disciplina/components/nova-ocorrencia-form";
import { listMotivosFrequentes } from "@/modules/disciplina/queries/list-motivos-frequentes";
import { PERMISSIONS } from "@/modules/rbac/permissions";
import { requirePermission } from "@/modules/rbac/services/rbac-service";
import { listTurmasAtivasOptions } from "@/modules/turmas/queries/list-turmas-options";
import {
  salasDistintas,
  salasPorSerie,
  seriesDistintas,
} from "@/modules/turmas/services/turma-nome";

export const dynamic = "force-dynamic";

export default async function NovaOcorrenciaPage() {
  const context = await requirePermission(PERMISSIONS.OCORRENCIAS_CREATE);
  const [turmas, motivos] = await Promise.all([
    listTurmasAtivasOptions(context.colegioId),
    listMotivosFrequentes(),
  ]);
  const nomes = turmas.map((t) => t.nome);

  return (
    <AdminPage
      description="Registra a comunicação de um fato. O enquadramento e a eventual sanção vêm depois, pela autoridade competente."
      eyebrow="Disciplina"
      title="Nova comunicação"
    >
      <FormSection
        description="A comunicação nasce como rascunho. Ao enviar, ela recebe número oficial e cada aluno ganha um processo individual."
        title="Dados da ocorrência"
      >
        <NovaOcorrenciaForm
          motivos={motivos}
          salasPorSerie={salasPorSerie(nomes)}
          series={seriesDistintas(nomes)}
          todasSalas={salasDistintas(nomes)}
        />
      </FormSection>
      <Link
        className="text-sm font-medium text-navy-900 hover:underline"
        href="/disciplina/ocorrencias"
      >
        Voltar para a lista
      </Link>
    </AdminPage>
  );
}
