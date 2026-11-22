"use client";

import { useEffect, useRef, useState } from "react";
import CoverImage from "@/components/ui/CoverImage";
import DropZone from "@/components/ui/DropZone";
import { albumCoverUrl } from "@/services/albumService";
import type { Album, AlbumInput } from "@/types/album";
import { IMAGE_MAX_INPUT_BYTES, compressImage, formatFileSize } from "@/utils/imageCompress";

const ACCEPT = "image/jpeg,image/png,image/webp";

export default function AlbumForm({
  album,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  album?: Album | null;
  submitLabel: string;
  onSubmit: (input: AlbumInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(album?.title ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [newCover, setNewCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [preview, setPreview] = useState<string | null>(album ? albumCoverUrl(album) : null);
  const [info, setInfo] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  async function pick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return setError("Chỉ chấp nhận tệp ảnh (JPG, PNG, WebP).");
    if (f.size > IMAGE_MAX_INPUT_BYTES) return setError("Ảnh gốc quá lớn (tối đa 40 MB).");
    setError(null);
    setCompressing(true);
    try {
      const r = await compressImage(f);
      setNewCover(r.file);
      setRemoveCover(false);
      setPreview(URL.createObjectURL(r.file));
      setInfo(r.compressed ? `Đã tự nén ảnh: ${formatFileSize(r.originalSize)} → ${formatFileSize(r.file.size)}` : `Ảnh ${formatFileSize(f.size)} — giữ nguyên`);
    } finally {
      setCompressing(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ title, description, newCover, removeCover });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được album");
      setBusy(false);
    }
  }

  const showCover = preview && !removeCover;

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <div>
        <DropZone accept={ACCEPT} onFile={pick} onReject={setError} disabled={compressing} rounded="rounded-2xl" label="Thả ảnh bìa vào đây">
          <button type="button" onClick={() => inputRef.current?.click()} aria-label="Chọn ảnh bìa album"
            className="group relative block aspect-square w-full overflow-hidden rounded-2xl border-2 border-dashed border-line bg-accent-soft transition hover:border-accent">
            {showCover ? (
              <CoverImage src={preview} eager className="h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/logo.png" alt="Logo Phật Tại Tâm" className="h-full w-full object-contain p-5 opacity-70" />
            )}
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-center text-xs font-medium text-white">
              {compressing ? "Đang nén ảnh…" : "Bấm hoặc kéo-thả ảnh vào"}
            </span>
          </button>
        </DropZone>
        <input ref={inputRef} type="file" accept={ACCEPT} hidden
          onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ""; pick(f); }} />
        <p className="mt-1.5 text-[11px] leading-snug text-muted">Ảnh tỉ lệ nào cũng được — vừa khung, không bị cắt. Ảnh lớn được tự nén xuống khoảng 1 MB.</p>
        {info && !compressing && <p className="mt-1 text-xs text-green-500">{info}</p>}
        {album?.cover_path && !newCover && (
          <label className="mt-2 flex items-center gap-2 text-sm text-red-500">
            <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} className="accent-[var(--accent)]" /> Xoá ảnh bìa
          </label>
        )}
      </div>
      <div className="space-y-4">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên album, ví dụ: Hơi Ấm Quê Mình" className="field font-serif text-xl" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Giới thiệu album (không bắt buộc)" className="field" />
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          {onCancel && <button type="button" onClick={onCancel} className="btn btn-secondary !py-3">Huỷ</button>}
          <button disabled={busy || compressing} className="btn btn-primary !px-7 !py-3 sm:order-first">{busy ? "Đang lưu…" : submitLabel}</button>
        </div>
      </div>
    </form>
  );
}
