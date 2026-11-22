"use client";

import { useRef } from "react";
import DropZone from "@/components/ui/DropZone";

/**
 * Ô chọn tệp: bấm để chọn hoặc KÉO-THẢ tệp từ máy tính vào.
 * Thay cho <input type="file"> mặc định.
 */
export default function FileDrop({
  accept,
  title,
  hint,
  file,
  onFile,
  onReject,
  required = false,
  disabled = false,
  children,
}: {
  accept: string;
  title: string;
  hint?: string;
  file: File | null;
  onFile: (f: File | null) => void;
  onReject?: (msg: string) => void;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <DropZone accept={accept} onFile={(f) => onFile(f)} onReject={onReject} disabled={disabled}>
      <div className="rounded-xl border-2 border-dashed border-line bg-surface p-4 text-sm text-ink-soft transition hover:border-accent/60">
        <p className="font-medium text-ink">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-secondary !py-2" disabled={disabled} onClick={() => ref.current?.click()}>
            📁 Chọn tệp
          </button>
          <span className="min-w-0 flex-1 break-all text-xs">
            {file ? <>✓ {file.name}</> : <span className="text-muted">…hoặc kéo-thả tệp vào khung này</span>}
          </span>
          {file && (
            <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => onFile(null)}>Bỏ chọn</button>
          )}
        </div>
        {children}
        {/* Ô ẩn để hỗ trợ "required" của trình duyệt khi chưa chọn tệp */}
        <input
          ref={ref}
          type="file"
          accept={accept}
          required={required && !file}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ""; if (f) onFile(f); }}
        />
      </div>
    </DropZone>
  );
}
