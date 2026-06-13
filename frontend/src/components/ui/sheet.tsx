"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A bottom sheet on mobile / centered dialog on larger screens.
 * Used for all add/edit forms.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 max-h-[90vh] w-full overflow-y-auto bg-surface shadow-[var(--shadow-pop)]",
          "rounded-t-[24px] sm:max-w-md sm:rounded-[24px]",
          "animate-[var(--animate-fade-up)]",
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-muted"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 border-t border-line bg-surface px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children = "Delete",
}: {
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      onClick={() => {
        if (confirm("Are you sure? This cannot be undone.")) onConfirm();
      }}
      className="text-sm font-semibold text-danger hover:underline"
    >
      {children}
    </button>
  );
}
