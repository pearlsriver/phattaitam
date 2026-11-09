"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import SongCard from "@/components/music/SongCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import ShareButtons from "@/components/social/ShareButtons";
import { useAuth } from "@/hooks/useAuth";
import { getPlaylist, listPlaylistSongs, removeSongFromPlaylist, updatePlaylist } from "@/services/playlistService";
import type { Playlist } from "@/types/social";
import type { Song } from "@/types/song";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { playSong, playList, startRadio, current } = usePlayer();
  const [pl, setPl] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([getPlaylist(id), listPlaylistSongs(id)]);
      setPl(p);
      setSongs(s);
      setState(p ? "ok" : "notfound");
    } catch {
      setState("notfound");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!pl) return <p className="py-16 text-center text-ink-soft">Không tìm thấy playlist (hoặc playlist đang để riêng tư).</p>;

  const mine = user?.id === pl.owner_id;

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Playlist</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">{pl.title}</h1>
      <p className="mt-1 text-sm text-muted">
        <Link href={`/tac-gia/${pl.owner_id}`} className="hover:underline">{pl.owner?.full_name ?? ""}</Link> · {songs.length} bài · {pl.is_public ? "Công khai" : "Riêng tư"}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!songs.length} onClick={() => playList(songs, pl.title)}
          className="rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-50">▶ Phát</button>
        <button type="button" disabled={!songs.length} onClick={() => startRadio(songs, `Radio · ${pl.title}`)}
          className="rounded-full border border-line bg-surface px-5 py-3 font-medium text-ink hover:bg-soft disabled:opacity-50">🔀 Phát ngẫu nhiên</button>
        {mine && (
          <>
            <button type="button" className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft"
              onClick={async () => { const t = prompt("Tên playlist:", pl.title); if (t?.trim()) { await updatePlaylist(pl.id, { title: t.trim() }); load(); } }}>
              ✏️ Đổi tên
            </button>
            <button type="button" className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft"
              onClick={async () => { await updatePlaylist(pl.id, { is_public: !pl.is_public }); load(); }}>
              {pl.is_public ? "🔒 Chuyển riêng tư" : "🌐 Công khai"}
            </button>
          </>
        )}
        {pl.is_public && <ShareButtons title={pl.title} />}
      </div>

      <div className="mt-8 space-y-3">
        {!songs.length && <p className="text-muted">Playlist trống. Vào <Link href="/nhac" className="text-accent hover:underline">Nhạc</Link> và bấm ＋ để thêm bài.</p>}
        {songs.map((s, i) => (
          <SongCard key={s.id} song={s} trackNo={i + 1} active={current?.id === s.id} onPlay={() => playSong(s, songs, pl.title)}
            extra={mine ? (
              <button type="button" title="Bỏ khỏi playlist" aria-label="Bỏ khỏi playlist"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-red-600 hover:bg-soft"
                onClick={async () => { await removeSongFromPlaylist(pl.id, s.id); load(); }}>−</button>
            ) : undefined} />
        ))}
      </div>
    </div>
  );
}
