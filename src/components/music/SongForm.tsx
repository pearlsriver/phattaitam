"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FileDrop from "@/components/ui/FileDrop";
import VisibilityPicker from "@/components/ui/VisibilityPicker";
import { useAuth } from "@/hooks/useAuth";
import { MAX_UPLOAD_MB } from "@/lib/supabase";
import type { Visibility } from "@/lib/visibility";
import { listAlbums, listAlbumsByOwner } from "@/services/albumService";
import { songAudioUrl, songCoverUrl } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Song, SongInput } from "@/types/song";
import { readAudioDuration } from "@/utils/audioDuration";
import { formatDuration } from "@/utils/formatDate";

const AUDIO_ACCEPT = "audio/*,.mp3,.m4a,.wav,.ogg,.aac,.flac";
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

/** Form dùng chung cho Tải nhạc lên và Sửa bài hát (bấm hoặc kéo-thả tệp) */
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
  const { user, profile, isAdmin, canPublish } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [title, setTitle] = useState(song?.title ?? "");
  const [artist, setArtist] = useState(song?.artist ?? profile?.full_name ?? "");
  // Bài Đĩa đơn (album solo) = "không chọn album"
  const [albumId, setAlbumId] = useState<string>(song?.album_info?.is_solo ? "" : (song?.album_id ?? ""));
  const [trackNo, setTrackNo] = useState<string>(song?.track_no ? String(song.track_no) : "");
  const [lyrics, setLyrics] = useState(song?.lyrics ?? "");
  const [visibility, setVisibility] = useState<Visibility>(song?.visibility ?? "public");
  const [newAudio, setNewAudio] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [newCover, setNewCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (isAdmin ? listAlbums() : listAlbumsByOwner(user.id)).then(setAlbums).catch(() => {});
  }, [user, isAdmin]);

  const limit = MAX_UPLOAD_MB * 1024 * 1024;

  async function pickAudio(f: File | null) {
    setDurationSec(null);
    if (f && f.size > limit) return setError(`Tệp nhạc vượt quá ${MAX_UPLOAD_MB} MB.`);
    setError(null);
    setNewAudio(f);
    if (!f) return;
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    setMeasuring(true);
    setDurationSec(await readAudioDuration(f));
    setMeasuring(false);
  }

  function pickCover(f: File | null) {
    if (f && f.size > 40 * 1024 * 1024) return setError("Ảnh bìa gốc quá lớn (tối đa 40 MB).");
    setError(null);
    setNewCover(f);
    if (f) setRemoveCover(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!song && !newAudio) return setError("Hãy chọn tệp nhạc.");
    const n = parseInt(trackNo, 10);
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        title, artist, lyrics, visibility,
        albumId: albumId || null,
        trackNo: Number.isFinite(n) && n > 0 ? n : null,
        newAudio, durationSec, newCover, removeCover,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
      setBusy(false);
    }
  }

  const cover = song ? songCoverUrl(song) : null;
  const oldDur = formatDuration(song?.duration_seconds);

  return (
    <form onSubmit={submit} className="space-y-4">
      {song && (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
          {cover && !removeCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-20 w-20 rounded-xl object-contain" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-accent-soft text-3xl">🎵</div>
          )}
          <div className="min-w-0 flex-1">
            <audio controls src={songAudioUrl(song)} className="h-10 w-full" />
            {oldDur && <p className="mt-1 text-xs text-muted">Thời lượng: {oldDur}</p>}
          </div>
        </div>
      )}

      <FileDrop
        accept={AUDIO_ACCEPT}
        title={`🎵 ${song ? "Thay tệp nhạc (không bắt buộc)" : "Tệp nhạc"}`}
        hint={`MP3, M4A, WAV, OGG — tối đa ${MAX_UPLOAD_MB} MB`}
        file={newAudio}
        onFile={pickAudio}
        onReject={setError}
        required={!song}
      >
        {newAudio && (
          <p className="mt-2 text-xs text-muted">
            {measuring ? "Đang đo thời lượng…" : durationSec ? `Thời lượng: ${formatDuration(durationSec)}` : "Không đọc được thời lượng (vẫn tải lên được)."}
          </p>
        )}
      </FileDrop>

      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên bài hát" className="field" />
      <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Ca sĩ / tác giả" className="field" />

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <select value={albumId} onChange={(e) => setAlbumId(e.target.value)} className="field">
          <option value="">— Không chọn album (Đĩa đơn) —</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>{a.title}{isAdmin && a.owner?.full_name ? ` (${a.owner.full_name})` : ""}</option>
          ))}
        </select>
        <input type="number" min={1} value={trackNo} onChange={(e) => setTrackNo(e.target.value)} placeholder="Số thứ tự" className="field" />
      </div>
      <p className="-mt-2 text-xs text-muted">
        Không chọn album: bài hát là một <b>Đĩa đơn</b>.{" "}
        Chưa có album? <Link href="/album/moi" target="_blank" className="text-accent hover:underline">Tạo album mới</Link> rồi tải lại trang này.
      </p>

      <VisibilityPicker value={visibility} onChange={setVisibility} needsApproval={!canPublish} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">📝 Lời bài hát</span>
        <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)} rows={12}
          placeholder={"[Verse 1]\n…\n\n[Chorus]\n…"} className="field font-serif leading-relaxed" />
      </label>

      <FileDrop
        accept={IMAGE_ACCEPT}
        title="🖼 Ảnh bìa riêng (không bắt buộc)"
        hint="Nếu trống sẽ dùng bìa album. Ảnh lớn được tự nén xuống khoảng 1 MB."
        file={newCover}
        onFile={pickCover}
        onReject={setError}
      >
        {song?.cover_path && !newCover && (
          <label className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} className="accent-[var(--accent)]" />
            <span className="text-red-500">Xoá ảnh bìa hiện tại</span>
          </label>
        )}
      </FileDrop>

      {error && <p className="text-red-500">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && <button type="button" onClick={onCancel} className="btn btn-secondary !py-3">Huỷ</button>}
        <button disabled={busy || measuring} className="btn btn-primary !px-7 !py-3 sm:order-first">{busy ? "Đang lưu…" : submitLabel}</button>
      </div>
    </form>
  );
}
