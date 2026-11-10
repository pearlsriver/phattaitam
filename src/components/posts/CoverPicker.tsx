"use client";

import { useRef, useState } from "react";
import CoverImage from "@/components/ui/CoverImage";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage } from "@/services/storage";
import { IMAGE_MAX_INPUT_BYTES, compressImage, formatFileSize } from "@/utils/imageCompress";

/**
 * Ô chọn Ảnh bìa / Bìa sách: xem trước, đổi ảnh, bỏ ảnh.
 * - Ảnh luôn hiển thị VỪA KHUNG, không bị cắt (tỉ lệ khác sẽ có nền mờ hai bên).
 * - Ảnh lớn được TỰ NÉN xuống ~1 MB trước khi tải lên.
 */
export default function CoverPicker({
  value,
  onChange,
  onUploaded,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Báo cho form biết ảnh vừa tải lên (để dọn nếu cuối cùng không dùng) */
  onUploaded?: (url: string) => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"compress" | "upload" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return setError("Chỉ chấp nhận tệp ảnh (JPG, PNG, WebP).");
    if (file.size > IMAGE_MAX_INPUT_BYTES) return setError("Ảnh gốc quá lớn (tối đa 40 MB).");

    setError(null);
    setInfo(null);
    try {
      setBusy("compress");
      const r = await compressImage(file);
      setBusy("upload");
      const url = await uploadImage(r.file, user.id, "cover-");
      onUploaded?.(url);
      onChange(url);
      setInfo(r.compressed ? `Đã tự nén ảnh: ${formatFileSize(r.originalSize)} → ${formatFileSize(r.file.size)}` : `Ảnh ${formatFileSize(file.size)} — giữ nguyên`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được ảnh");
    } finally {
      setBusy(null);
    }
  }

  const label = busy === "compress" ? "Đang nén ảnh…" : busy === "upload" ? "Đang tải lên…" : null;

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink">Ảnh bìa / Bìa sách</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!!busy}
        aria-label={value ? "Đổi ảnh bìa" : "Chọn ảnh bìa"}
        className="group relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface transition hover:border-accent"
      >
        {value ? (
          <>
            <CoverImage src={value} alt="Ảnh bìa" eager className="absolute inset-0" />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-center text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">Đổi ảnh</span>
          </>
        ) : (
          <span className="px-3 text-center text-xs text-muted">
            <span className="mb-1 block text-3xl">🖼</span>
            {label ?? "Chạm để chọn ảnh bìa"}
            <span className="mt-1 block opacity-80">Ảnh tỉ lệ nào cũng được — hiển thị vừa khung, không bị cắt</span>
          </span>
        )}
        {label && value && <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm text-white">{label}</span>}
      </button>

      {value && (
        <div className="mt-2 flex gap-2">
          <button type="button" className="btn btn-secondary flex-1 !min-h-0 !px-2 !py-1.5 !text-xs" onClick={() => inputRef.current?.click()} disabled={!!busy}>Đổi ảnh</button>
          <button type="button" className="btn btn-danger flex-1 !min-h-0 !px-2 !py-1.5 !text-xs" onClick={() => { onChange(null); setInfo(null); }} disabled={!!busy}>Bỏ ảnh</button>
        </div>
      )}
      <p className="mt-1.5 text-[11px] leading-snug text-muted">Ảnh lớn được tự nén xuống khoảng 1 MB khi tải lên.</p>
      {info && <p className="mt-1 text-xs text-green-500">{info}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
    </div>
  );
}
