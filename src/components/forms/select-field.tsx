type SelectFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  options: Array<{
    label: string;
    value: string;
  }>;
};

export function SelectField({
  label,
  name,
  required,
  defaultValue,
  options,
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20"
        defaultValue={defaultValue}
        name={name}
        required={required}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
