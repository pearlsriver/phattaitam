"use client";

import Link from "next/link";
import AddToPlaylist from "@/components/music/AddToPlaylist";
import { useAuth } from "@/hooks/useAuth";
import { songCoverUrl, songDownloadUrl } from "@/services/songService";
import type { Song } from "@/types/song";
import { formatCount } from "@/utils/formatDate";

export default function SongCard({
  song,
  active,
  onPlay,
  trackNo,
  extra,
}: {
  song: Song;
  active?: boolean;
  onPlay: () => void;
  trackNo?: number;
  extra?: React.ReactNode;
}) {
  const { user, isAdmin } = useAuth();
  const cover = songCoverUrl(song);
  const canEdit = !!user && (user.id === song.uploader_id || isAdmin);
  const iconBtn = "flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft hover:bg-soft";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border bg-surface p-3 transition ${
        active ? "border-accent ring-1 ring-accent" : "border-line hover:shadow-md"
      }`}
    >
      {trackNo !== undefined && <span className="w-6 text-center text-sm text-muted">{trackNo}</span>}
      <button type="button" onClick={onPlay} className="group relative shrink-0" aria-label={`Phát ${song.title}`}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-14 w-14 rounded-xl object-cover" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent-soft text-2xl">🎵</div>
        )}
        <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/35 text-xl text-white opacity-0 transition group-hover:opacity-100">▶</span>
      </button>
      <div className="min-w-0 flex-1">
        <Link href={`/bai-hat/${song.id}`} className="block truncate font-medium text-ink hover:underline">{song.title}</Link>
        <p className="truncate text-sm text-muted">
          {song.artist ?? "Không rõ"}
          {song.album_info && (
            <>
              {" · "}
              <Link href={`/album/${song.album_info.id}`} className="hover:underline">{song.album_info.title}</Link>
            </>
          )}
        </p>
        <p className="text-xs text-muted">▶ {formatCount(song.play_count)} lượt nghe{song.lyrics ? " · có lời" : ""}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {extra}
        <AddToPlaylist songId={song.id} />
        {canEdit && <Link href={`/sua-nhac/${song.id}`} title="Sửa" className={`${iconBtn} hidden sm:flex`}>✏️</Link>}
        <a href={songDownloadUrl(song)} title="Tải về" className={`${iconBtn} hidden sm:flex`}>⬇</a>
      </div>
    </div>
  );
}
