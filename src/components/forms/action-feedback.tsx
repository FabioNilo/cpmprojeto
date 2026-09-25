import type { ActionState } from "@/lib/actions/action-state";

type ActionFeedbackProps = {
  state: ActionState;
};

export function ActionFeedback({ state }: ActionFeedbackProps) {
  if (!state.message || state.status === "idle") {
    return null;
  }

  const className =
    state.status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${className}`}>
      {state.message}
    </p>
  );
}
