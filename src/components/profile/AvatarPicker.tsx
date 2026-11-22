"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/social/Avatar";
import DropZone from "@/components/ui/DropZone";
import { IMAGE_MAX_INPUT_BYTES, compressImage, formatFileSize } from "@/utils/imageCompress";

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Chọn ảnh đại diện (bấm hoặc kéo-thả) — giống ô ảnh bìa album.
 * Ảnh CHỈ được tải lên khi bấm "Lưu hồ sơ".
 */
export default function AvatarPicker({
  currentUrl,
  googleUrl,
  name,
  onChange,
}: {
  currentUrl: string | null;
  googleUrl: string | null;
  name: string;
  onChange: (v: { file: File | null; url: string | null; preview: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set(file: File | null, url: string | null, p: string | null) {
    if (preview?.startsWith("blob:") && preview !== p) URL.revokeObjectURL(preview);
    setPreview(p);
    onChange({ file, url, preview: p });
  }

  async function handle(f: File) {
    if (!f.type.startsWith("image/")) return setError("Chỉ chấp nhận tệp ảnh (JPG, PNG, WebP).");
    if (f.size > IMAGE_MAX_INPUT_BYTES) return setError("Ảnh gốc quá lớn (tối đa 40 MB).");
    setError(null);
    setBusy(true);
    try {
      const r = await compressImage(f, { maxDimension: 1024 });
      set(r.file, null, URL.createObjectURL(r.file));
      setInfo(r.compressed ? `Đã tự nén: ${formatFileSize(r.originalSize)} → ${formatFileSize(r.file.size)}` : `Ảnh ${formatFileSize(f.size)} — giữ nguyên`);
    } catch {
      setError("Không đọc được ảnh này.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <DropZone accept={ACCEPT} onFile={handle} onReject={setError} disabled={busy} rounded="rounded-full" label="Thả ảnh">
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
          className="group relative rounded-full ring-2 ring-line transition hover:ring-accent" aria-label="Chọn ảnh đại diện">
          <Avatar url={preview} name={name} size={128} />
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-sm font-medium text-white opacity-0 transition group-hover:opacity-100">
            {busy ? "Đang nén…" : "📷 Đổi ảnh"}
          </span>
        </button>
      </DropZone>

      <div className="flex flex-col items-center gap-2 sm:items-start">
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" className="btn btn-secondary !py-2" disabled={busy} onClick={() => inputRef.current?.click()}>
            📷 {preview ? "Đổi ảnh" : "Chọn ảnh"}
          </button>
          {googleUrl && preview !== googleUrl && (
            <button type="button" className="btn btn-ghost !py-2" disabled={busy} onClick={() => { set(null, googleUrl, googleUrl); setInfo("Dùng ảnh từ tài khoản Google"); }}>
              Dùng ảnh Google
            </button>
          )}
          {preview && (
            <button type="button" className="btn btn-danger !py-2" disabled={busy} onClick={() => { set(null, null, null); setInfo(null); }}>
              Bỏ ảnh
            </button>
          )}
        </div>
        <p className="text-center text-xs text-muted sm:text-left">
          Bấm hoặc kéo-thả ảnh vào khung tròn. Ảnh tỉ lệ nào cũng được, không bị cắt; ảnh lớn được tự nén xuống khoảng 1 MB.
        </p>
        {info && <p className="text-xs text-green-500">{info}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} hidden
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handle(f); }} />
    </div>
  );
}
