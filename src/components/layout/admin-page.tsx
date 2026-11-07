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
      <div className="mb-5 md:mb-6">
        <p className="hidden text-xs font-semibold uppercase text-gold-600 md:block">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-semibold text-slate-950 md:mt-1">{title}</h1>
        <p className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600 md:mt-2 md:line-clamp-none">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
