type AdminPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminPage({
  eyebrow,
  title,
  description,
  children,
}: AdminPageProps) {
  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase text-gold-600">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
