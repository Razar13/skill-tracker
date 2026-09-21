"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  isSubmitting = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div
        className="card max-w-sm w-full"
        style={{ "--tab-color": "#c66" } as React.CSSProperties}
      >
        <h3 className="display text-lg mb-2">{title}</h3>
        <p className="text-sm mb-6" style={{ color: "var(--ink-dim)" }}>
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-ghost">
            CANCEL
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="btn-primary"
            style={{ background: "#c66", boxShadow: "2px 2px 0 rgba(0,0,0,0.45)" }}
          >
            {isSubmitting ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}