// Silhueta exibida enquanto o servidor monta a tela.
export function CarregandoPagina() {
  return (
    <div aria-busy="true" aria-label="Carregando" role="status">
      <div className="esqueleto mb-2 h-8 w-48" />
      <div className="esqueleto mb-5 h-4 w-full max-w-md" />
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div className="esqueleto h-24" key={item} />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div className="esqueleto h-28" key={item} />
        ))}
      </div>
    </div>
  );
}
