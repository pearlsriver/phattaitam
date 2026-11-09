"use client";

import { useState } from "react";
import { albumCoverUrl } from "@/services/albumService";
import type { Album, AlbumInput } from "@/types/album";

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
  const [title, setTitle] = useState(album?.title ?? "");
  const [description, setDescription] = useState(album?.description ?? "");
  const [newCover, setNewCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [preview, setPreview] = useState<string | null>(album ? albumCoverUrl(album) : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setNewCover(f);
    setRemoveCover(false);
    if (f) setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newCover && newCover.size > 10 * 1024 * 1024) return setError("Ảnh bìa tối đa 10 MB.");
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ title, description, newCover, removeCover });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được album");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-6 md:grid-cols-[14rem_1fr]">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-accent-soft">
          {preview && !removeCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">💿</div>
          )}
        </div>
        <label className="mt-3 block text-sm text-ink-soft">
          <span className="mb-1 block font-medium text-ink">Ảnh bìa album</span>
          <input type="file" accept="image/*" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        {album?.cover_path && !newCover && (
          <label className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} /> Xoá ảnh bìa
          </label>
        )}
      </div>
      <div className="space-y-4">
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên album, ví dụ: Hơi Ấm Quê Mình" className="field font-serif text-xl" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Giới thiệu album (không bắt buộc)" className="field" />
        {error && <p className="text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button disabled={busy} className="rounded-full bg-ink px-7 py-3 font-medium text-paper hover:opacity-90 disabled:opacity-50">
            {busy ? "Đang lưu…" : submitLabel}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-full border border-line px-6 py-3 text-ink-soft hover:bg-soft">Huỷ</button>
          )}
        </div>
      </div>
    </form>
  );
}
