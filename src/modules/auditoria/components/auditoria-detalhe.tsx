type AuditoriaDetalheRegistro = {
  id: string;
  acao: string;
  entidade: string | null;
  entidadeId: string | null;
  ip: string | null;
  userAgent: string | null;
  dataHora: Date;
  dadosAnteriores: unknown;
  dadosNovos: unknown;
  usuario: { id: string; nome: string } | null;
  colegio: { id: string; nome: string; codigo: string } | null;
};

type AuditoriaDetalheProps = {
  registro: AuditoriaDetalheRegistro;
};

function formatDataHora(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(value);
}

function DefinitionRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-slate-100 py-3 sm:grid-cols-[200px_1fr]">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="break-words text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
      {value === null || value === undefined ? (
        <p className="text-sm text-slate-500">Sem dados.</p>
      ) : (
        <pre className="overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-800">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AuditoriaDetalhe({ registro }: AuditoriaDetalheProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <dl>
          <DefinitionRow label="Ação" value={registro.acao} />
          <DefinitionRow
            label="Data e hora"
            value={formatDataHora(registro.dataHora)}
          />
          <DefinitionRow label="Entidade" value={registro.entidade ?? "-"} />
          <DefinitionRow
            label="Registro (entidadeId)"
            value={registro.entidadeId ?? "-"}
          />
          <DefinitionRow
            label="Usuário"
            value={
              registro.usuario
                ? `${registro.usuario.nome} (${registro.usuario.id})`
                : "-"
            }
          />
          <DefinitionRow
            label="Colégio"
            value={
              registro.colegio
                ? `${registro.colegio.nome} (${registro.colegio.codigo})`
                : "Evento global de sistema"
            }
          />
          <DefinitionRow label="IP" value={registro.ip ?? "-"} />
          <DefinitionRow
            label="User agent"
            value={registro.userAgent ?? "-"}
          />
        </dl>
      </section>

      <section className="grid gap-6 rounded-lg border border-slate-200 bg-white p-5 lg:grid-cols-2">
        <JsonBlock label="Dados anteriores" value={registro.dadosAnteriores} />
        <JsonBlock label="Dados novos" value={registro.dadosNovos} />
      </section>
    </div>
  );
}
