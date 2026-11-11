"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/Icons";

/** Hộp thoại nổi (gắn vào <body> để không phá bố cục nơi gọi) */
export default function Modal({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`anim-in flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="font-serif text-lg font-semibold text-ink">{title}</p>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Đóng"><CloseIcon size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="safe-bottom flex flex-wrap justify-end gap-2 border-t border-line bg-soft/40 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
