type FormSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
