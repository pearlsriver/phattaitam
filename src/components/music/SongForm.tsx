"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MAX_UPLOAD_MB } from "@/lib/supabase";
import { listAlbums, listAlbumsByOwner } from "@/services/albumService";
import { songAudioUrl, songCoverUrl } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Song, SongInput } from "@/types/song";

/** Form dùng chung cho Tải nhạc lên và Sửa bài hát */
export default function SongForm({
  song,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  song?: Song | null;
  submitLabel: string;
  onSubmit: (input: SongInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const { user, profile, isAdmin } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [title, setTitle] = useState(song?.title ?? "");
  const [artist, setArtist] = useState(song?.artist ?? profile?.full_name ?? "");
  const [albumId, setAlbumId] = useState<string>(song?.album_id ?? "");
  const [trackNo, setTrackNo] = useState<string>(song?.track_no ? String(song.track_no) : "");
  const [lyrics, setLyrics] = useState(song?.lyrics ?? "");
  const [newAudio, setNewAudio] = useState<File | null>(null);
  const [newCover, setNewCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (isAdmin ? listAlbums() : listAlbumsByOwner(user.id)).then(setAlbums).catch(() => {});
  }, [user, isAdmin]);

  const limit = MAX_UPLOAD_MB * 1024 * 1024;

  function pickAudio(f: File | null) {
    setNewAudio(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!song && !newAudio) return setError("Hãy chọn tệp nhạc.");
    if (newAudio && newAudio.size > limit) return setError(`Tệp nhạc vượt quá ${MAX_UPLOAD_MB} MB.`);
    if (newCover && newCover.size > limit) return setError(`Ảnh bìa vượt quá ${MAX_UPLOAD_MB} MB.`);
    const n = parseInt(trackNo, 10);
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title, artist, lyrics,
        albumId: albumId || null,
        trackNo: Number.isFinite(n) && n > 0 ? n : null,
        newAudio, newCover, removeCover,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
      setBusy(false);
    }
  }

  const drop = "block rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-soft";
  const cover = song ? songCoverUrl(song) : null;

  return (
    <form onSubmit={submit} className="space-y-4">
      {song && (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          {cover && !removeCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-20 w-20 rounded-xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-accent-soft text-3xl">🎵</div>
          )}
          <audio controls src={songAudioUrl(song)} className="h-10 min-w-0 flex-1" />
        </div>
      )}

      <label className={drop}>
        <span className="mb-2 block font-medium text-ink">
          🎵 {song ? "Thay tệp nhạc (không bắt buộc)" : "Tệp nhạc"} — MP3, M4A, WAV, OGG, tối đa {MAX_UPLOAD_MB} MB
        </span>
        <input required={!song} type="file" accept="audio/*" onChange={(e) => pickAudio(e.target.files?.[0] ?? null)} />
      </label>

      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên bài hát" className="field" />
      <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ca sĩ / tác giả" className="field" />

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} className="field">
          <option value="">— Không thuộc album —</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>{a.title}{isAdmin && a.owner?.full_name ? ` (${a.owner.full_name})` : ""}</option>
          ))}
        </select>
        <input type="number" min={1} value={trackNo} onChange={(e) => setTrackNo(e.target.value)} placeholder="Số thứ tự" className="field" />
      </div>
      <p className="-mt-2 text-xs text-muted">
        Chưa có album? <Link href="/album/moi" target="_blank" className="text-accent hover:underline">Tạo album mới</Link> rồi tải lại trang này.
      </p>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">📝 Lời bài hát</span>
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={12}
          placeholder={"[Verse 1]\n…\n\n[Chorus]\n…"} className="field font-serif leading-relaxed" />
      </label>

      <div className={drop}>
        <span className="mb-2 block font-medium text-ink">🖼 Ảnh bìa riêng (không bắt buộc — nếu trống sẽ dùng bìa album)</span>
        {song?.cover_path && !newCover && (
          <label className="mb-2 flex items-center gap-2">
            <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />
            <span className="text-red-600">Xoá ảnh bìa hiện tại</span>
          </label>
        )}
        <input type="file" accept="image/*" onChange={(e) => { setNewCover(e.target.files?.[0] ?? null); setRemoveCover(false); }} />
      </div>

      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="rounded-full bg-ink px-7 py-3 font-medium text-paper hover:opacity-90 disabled:opacity-50">
          {busy ? "Đang lưu…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border border-line px-6 py-3 text-ink-soft hover:bg-soft">Huỷ</button>
        )}
      </div>
    </form>
  );
}
