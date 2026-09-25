type AuthCardProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ eyebrow, title, children, footer }: AuthCardProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-navy-950 px-5 py-10">
      <div className="w-full max-w-md rounded-lg border border-white/15 bg-white p-7 shadow-2xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase text-gold-600">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
        </div>
        {children}
        {footer ? (
          <div className="mt-6 text-sm text-slate-600">{footer}</div>
        ) : null}
      </div>
    </main>
  );
}
