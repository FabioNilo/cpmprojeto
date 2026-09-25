type TextAreaFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  rows?: number;
};

export function TextAreaField({
  label,
  name,
  required,
  placeholder,
  defaultValue,
  rows = 4,
}: TextAreaFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <textarea
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
      />
    </label>
  );
}
