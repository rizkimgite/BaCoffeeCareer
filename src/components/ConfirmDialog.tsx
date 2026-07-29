"use client";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: "success" | "error" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const toneClass =
    confirmTone === "success"
      ? "bg-success hover:bg-success/90"
      : confirmTone === "error"
        ? "bg-error hover:bg-error/90"
        : "bg-primary hover:bg-primary/90";

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-title text-lg font-bold text-primary">{title}</h3>
        <p className="mt-2 text-sm text-primary/70">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-primary/70 transition-colors hover:bg-secondary"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${toneClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
