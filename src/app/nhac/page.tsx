"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import SongCard from "@/components/music/SongCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import { useSongs } from "@/hooks/useSongs";
import { useAuth } from "@/hooks/useAuth";
import { listAlbums } from "@/services/albumService";
import type { Album } from "@/types/album";
import { matchSearch } from "@/utils/slug";

export default function MusicPage() {
  const { songs, loading, error } = useSongs();
  const { user } = useAuth();
  const { playSong, startRadio, current } = usePlayer();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [q, setQ] = useState("");
  const [radioAlbum, setRadioAlbum] = useState("");
  const [sort, setSort] = useState<"new" | "plays">("new");

  useEffect(() => {
    listAlbums().then(setAlbums).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const list = songs.filter((s) => matchSearch(`${s.title} ${s.artist ?? ""} ${s.album_info?.title ?? ""}`, q));
    return sort === "plays" ? [...list].sort((a, b) => b.play_count - a.play_count) : list;
  }, [songs, q, sort]);

  function radio() {
    const album = albums.find((a) => a.id === radioAlbum);
    const list = album ? songs.filter((s) => s.album_id === album.id) : songs;
    startRadio(list, album ? `Radio · ${album.title}` : "Radio Phật Tại Tâm");
  }

  return (
    <div>
      <section className="mb-12 grid items-center gap-6 rounded-[2rem] bg-ink px-8 py-10 text-paper md:grid-cols-[1.3fr_1fr] md:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">Âm nhạc</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold">Nghe trong lúc đọc</h1>
          <p className="mt-3 max-w-md opacity-80">Nghe, tải về, xem lời, hoặc bật radio phát ngẫu nhiên — toàn bộ thư viện hay từng album.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex w-full flex-wrap gap-2 md:justify-end">
            <select value={radioAlbum} onChange={(e) => setRadioAlbum(e.target.value)}
              className="rounded-full border border-paper/30 bg-transparent px-4 py-2.5 text-sm text-paper [&>option]:text-black">
              <option value="">Radio: toàn bộ thư viện</option>
              {albums.map((a) => <option key={a.id} value={a.id}>Radio: {a.title}</option>)}
            </select>
            <button type="button" onClick={radio} disabled={!songs.length}
              className="flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 font-medium text-ink hover:opacity-90 disabled:opacity-50">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm text-paper">▶</span> Bật Radio
            </button>
          </div>
          {user && (
            <div className="flex gap-3 text-sm">
              <Link href="/tai-nhac" className="underline opacity-80 hover:opacity-100">⬆ Tải nhạc lên</Link>
              <Link href="/album/moi" className="underline opacity-80 hover:opacity-100">＋ Tạo album</Link>
              <Link href="/playlist" className="underline opacity-80 hover:opacity-100">♫ Playlist của tôi</Link>
            </div>
          )}
        </div>
      </section>

      {albums.length > 0 && (
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between">
            <h2 className="font-serif text-2xl font-semibold text-ink">Album</h2>
            <Link href="/album" className="text-sm font-medium text-accent hover:underline">Tất cả →</Link>
          </div>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:grid-cols-6">
            {albums.slice(0, 6).map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        </section>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-2xl font-semibold text-ink">Tất cả bài hát</h2>
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "plays")} className="field !w-auto !rounded-full !py-1.5 text-sm">
          <option value="new">Mới nhất</option>
          <option value="plays">Nghe nhiều</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm bài hát, ca sĩ, album…" className="field ml-auto !w-full !rounded-full sm:!w-72" />
      </div>

      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !filtered.length && <p className="text-muted">Chưa có bài hát nào.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((s) => (
          <SongCard key={s.id} song={s} active={current?.id === s.id} onPlay={() => playSong(s, filtered, "Thư viện nhạc")} />
        ))}
      </div>
    </div>
  );
}
