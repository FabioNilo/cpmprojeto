"use client";

import { useEffect, useRef } from "react";

import type { ActionState } from "@/lib/actions/action-state";

type ActionFeedbackProps = {
  state: ActionState;
};

export function ActionFeedback({ state }: ActionFeedbackProps) {
  const elemento = useRef<HTMLParagraphElement>(null);

  // No celular, a mensagem pode nascer fora da area visivel.
  useEffect(() => {
    if (state.message && state.status !== "idle") {
      elemento.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [state]);

  if (!state.message || state.status === "idle") {
    return null;
  }

  const sucesso = state.status === "success";

  return (
    <p
      className={`anim-confirmacao flex scroll-mb-24 items-start gap-2 rounded-md border px-3 py-2 text-sm ${
        sucesso
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
      ref={elemento}
      role={sucesso ? "status" : "alert"}
    >
      <span aria-hidden className="font-bold leading-5">
        {sucesso ? "✓" : "!"}
      </span>
      <span className="min-w-0 break-words">{state.message}</span>
    </p>
  );
}
