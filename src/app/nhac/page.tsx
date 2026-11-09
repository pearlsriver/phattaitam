"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import SongCard from "@/components/music/SongCard";
import { RadioIcon } from "@/components/ui/Icons";
import { useAuth } from "@/hooks/useAuth";
import { useSongs } from "@/hooks/useSongs";
import { listAlbums } from "@/services/albumService";
import { loadRadioQueue } from "@/services/radioService";
import type { Album } from "@/types/album";
import { matchSearch } from "@/utils/slug";

export default function MusicPage() {
  const { songs, loading, error } = useSongs();
  const { user, isAdmin } = useAuth();
  const { playSong, startRadio, current } = usePlayer();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [q, setQ] = useState("");
  const [radioAlbum, setRadioAlbum] = useState("");
  const [sort, setSort] = useState<"new" | "plays">("new");
  const [radioBusy, setRadioBusy] = useState(false);

  useEffect(() => {
    listAlbums().then(setAlbums).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const list = songs.filter((s) => matchSearch(`${s.title} ${s.artist ?? ""} ${s.album_info?.title ?? ""}`, q));
    return sort === "plays" ? [...list].sort((a, b) => b.play_count - a.play_count) : list;
  }, [songs, q, sort]);

  async function radio() {
    const album = albums.find((a) => a.id === radioAlbum);
    if (album) {
      startRadio(songs.filter((s) => s.album_id === album.id), `Radio · ${album.title}`);
      return;
    }
    setRadioBusy(true);
    try {
      // Danh sách do quản trị viên chọn (hoặc toàn bộ thư viện nếu chưa chọn)
      const r = await loadRadioQueue();
      startRadio(r.songs, "Radio Phật Tại Tâm", r.shuffle);
    } finally {
      setRadioBusy(false);
    }
  }

  return (
    <div>
      <section className="hero-glow mb-12 grid items-center gap-6 overflow-hidden rounded-[2rem] border border-line px-8 py-10 md:grid-cols-[1.3fr_1fr] md:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Âm nhạc</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Nghe trong lúc đọc</h1>
          <p className="mt-3 max-w-md text-ink-soft">Nghe, tải về, xem lời, hoặc bật Radio Phật Tại Tâm — phát liên tục từ danh sách do ban quản trị tuyển chọn.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex w-full flex-wrap gap-2 md:justify-end">
            <select value={radioAlbum} onChange={(e) => setRadioAlbum(e.target.value)} className="field !w-auto !rounded-full !py-2.5 text-sm">
              <option value="">Radio Phật Tại Tâm</option>
              {albums.map((a) => <option key={a.id} value={a.id}>Radio album: {a.title}</option>)}
            </select>
            <button type="button" onClick={radio} disabled={!songs.length || radioBusy} className="btn btn-primary">
              <RadioIcon size={18} /> {radioBusy ? "Đang tải…" : "Bật Radio"}
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {user && (
              <>
                <Link href="/tai-nhac" className="text-accent hover:underline">⬆ Tải nhạc lên</Link>
                <Link href="/album/moi" className="text-accent hover:underline">＋ Tạo album</Link>
                <Link href="/playlist" className="text-accent hover:underline">♫ Playlist của tôi</Link>
              </>
            )}
            {isAdmin && <Link href="/admin/radio" className="text-accent hover:underline">⚙ Quản lý Radio</Link>}
          </div>
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
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !filtered.length && <p className="text-muted">Chưa có bài hát nào.</p>}
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((s) => (
          <SongCard key={s.id} song={s} active={current?.id === s.id} onPlay={() => playSong(s, filtered, "Thư viện nhạc")} />
        ))}
      </div>
    </div>
  );
}
