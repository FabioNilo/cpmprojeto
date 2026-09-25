"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
};

const variants = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-slate-400",
  secondary:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:text-slate-400",
  danger: "bg-red-700 text-white hover:bg-red-800 disabled:bg-slate-400",
};

export function SubmitButton({
  children,
  pendingLabel = "Salvando...",
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold disabled:cursor-not-allowed ${variants[variant]}`}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
