"use client";

import { useEffect, useRef, useState } from "react";

/** Kiểm tra tệp có hợp với thuộc tính accept (".pdf,image/*,audio/mpeg") không */
export function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return accept
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a));
}

const hasFiles = (e: React.DragEvent | DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");

/**
 * Vùng kéo-thả tệp. Kéo tệp từ cửa sổ máy tính (Explorer/Finder) thả vào để chọn.
 * Bấm để chọn tệp vẫn do phần tử bên trong đảm nhận (nút / input).
 */
export default function DropZone({
  accept,
  onFile,
  onReject,
  disabled = false,
  className = "",
  rounded = "rounded-xl",
  label = "Thả tệp vào đây",
  children,
}: {
  accept?: string;
  onFile: (file: File) => void;
  onReject?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  rounded?: string;
  label?: string;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  // Thả tệp ra ngoài vùng: chặn trình duyệt tự mở tệp (mất nội dung đang soạn)
  useEffect(() => {
    const guard = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    window.addEventListener("dragover", guard);
    window.addEventListener("drop", guard);
    return () => {
      window.removeEventListener("dragover", guard);
      window.removeEventListener("drop", guard);
    };
  }, []);

  function onDragEnter(e: React.DragEvent) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    depth.current += 1;
    setOver(true);
  }
  function onDragOver(e: React.DragEvent) {
    if (disabled || !hasFiles(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
  function onDragLeave() {
    depth.current = Math.max(0, depth.current - 1);
    if (!depth.current) setOver(false);
  }
  function onDrop(e: React.DragEvent) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    e.stopPropagation();
    depth.current = 0;
    setOver(false);
    if (disabled) return;
    const file = Array.from(e.dataTransfer.files)[0];
    if (!file) return;
    if (!matchesAccept(file, accept)) {
      onReject?.(`Tệp "${file.name}" không đúng định dạng.`);
      return;
    }
    onFile(file);
  }

  return (
    <div className={`relative ${className}`} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      {children}
      {over && (
        <div
          className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-accent bg-accent/20 text-center text-sm font-semibold text-accent backdrop-blur-[1px] ${rounded}`}
        >
          ⬇ {label}
        </div>
      )}
    </div>
  );
}
