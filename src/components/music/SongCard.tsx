"use client";

import Link from "next/link";
import AddToPlaylist from "@/components/music/AddToPlaylist";
import CoverImage from "@/components/ui/CoverImage";
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
      className={`flex items-center gap-3 rounded-2xl border bg-surface p-2.5 transition sm:p-3 ${
        active ? "border-accent ring-1 ring-accent" : "border-line hover:shadow-md"
      }`}
    >
      {trackNo !== undefined && <span className="w-5 text-center text-sm text-muted sm:w-6">{trackNo}</span>}
      <button type="button" onClick={onPlay} className="group relative shrink-0" aria-label={`Phát ${song.title}`}>
        <CoverImage src={cover ?? "/logo-sm.png"} blur={false} className="h-12 w-12 rounded-xl sm:h-14 sm:w-14" />
        <span className={`absolute inset-0 flex items-center justify-center rounded-xl bg-black/35 text-xl text-white transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          {active ? "♪" : "▶"}
        </span>
      </button>
      {/* Điện thoại: chạm vào tên bài cũng phát nhạc */}
      <button type="button" onClick={onPlay} className="min-w-0 flex-1 text-left sm:hidden">
        <span className={`block truncate font-medium ${active ? "text-accent" : "text-ink"}`}>{song.title}</span>
        <span className="block truncate text-xs text-muted">{song.artist ?? "Không rõ"}{song.album_info ? ` · ${song.album_info.title}` : ""}</span>
        <span className="block text-[11px] text-muted">▶ {formatCount(song.play_count)}{song.lyrics ? " · có lời" : ""}</span>
      </button>
      <div className="hidden min-w-0 flex-1 sm:block">
        <Link href={`/bai-hat/${song.id}`} className={`block truncate font-medium hover:underline ${active ? "text-accent" : "text-ink"}`}>{song.title}</Link>
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
