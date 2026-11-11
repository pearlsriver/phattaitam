"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import SongCard from "@/components/music/SongCard";
import { EditableText as T } from "@/components/site/Editable";
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
  const [sort, setSort] = useState<"new" | "plays">("new");
  const [radioBusy, setRadioBusy] = useState(false);

  useEffect(() => {
    listAlbums({ includeSolo: true }).then(setAlbums).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const list = songs.filter((s) => matchSearch(`${s.title} ${s.artist ?? ""} ${s.album_info?.title ?? ""}`, q));
    return sort === "plays" ? [...list].sort((a, b) => b.play_count - a.play_count) : list;
  }, [songs, q, sort]);

  async function radio() {
    setRadioBusy(true);
    try {
      const r = await loadRadioQueue();
      startRadio(r.songs, "Radio Phật Tại Tâm", r.shuffle);
    } finally {
      setRadioBusy(false);
    }
  }

  return (
    <div>
      <section className="hero-glow mb-10 grid items-center gap-6 overflow-hidden rounded-3xl border border-line px-5 py-8 sm:mb-12 sm:rounded-[2rem] sm:px-8 sm:py-10 md:grid-cols-[1.3fr_1fr] md:px-12">
        <div>
          <T as="p" k="music.eyebrow" label="Trang Nhạc — nhãn nhỏ" className="block text-xs uppercase tracking-[0.25em] text-accent" />
          <T as="h1" k="music.title" label="Trang Nhạc — tiêu đề" className="mt-2 block font-serif text-3xl font-semibold text-ink sm:text-4xl" />
          <T as="p" k="music.desc" multiline label="Trang Nhạc — mô tả" className="mt-3 block max-w-md whitespace-pre-line text-sm text-ink-soft sm:text-base" />
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <button type="button" onClick={radio} disabled={!songs.length || radioBusy} className="btn btn-primary !px-6 !py-3">
            <RadioIcon size={18} /> {radioBusy ? "Đang tải…" : <T k="music.radioButton" label="Trang Nhạc — nút Radio" />}
          </button>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm md:justify-end">
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
        <section className="mb-10 sm:mb-12">
          <div className="mb-4 flex items-end justify-between sm:mb-5">
            <T as="h2" k="music.albumsTitle" label="Trang Nhạc — tiêu đề mục album" className="block font-serif text-2xl font-semibold text-ink" />
            <Link href="/album" className="text-sm font-medium text-accent hover:underline"><T k="music.albumsLink" label="Trang Nhạc — liên kết album" /></Link>
          </div>
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-6">
            {albums.slice(0, 12).map((a) => (
              <div key={a.id} className="w-36 shrink-0 snap-start sm:w-auto"><AlbumCard album={a} /></div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 sm:mb-5">
        <T as="h2" k="music.songsTitle" label="Trang Nhạc — tiêu đề danh sách bài" className="block font-serif text-2xl font-semibold text-ink" />
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "plays")} className="field !w-auto !rounded-full !py-1.5 text-sm">
          <option value="new">Mới nhất</option>
          <option value="plays">Nghe nhiều</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm bài hát, ca sĩ, album…" className="field !w-full !rounded-full sm:ml-auto sm:!w-72" />
      </div>

      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !filtered.length && <T as="p" k="music.empty" label="Khi chưa có bài hát" className="text-muted" />}
      <div className="grid gap-2.5 sm:gap-3 lg:grid-cols-2">
        {filtered.map((s) => (
          <SongCard key={s.id} song={s} active={current?.id === s.id} onPlay={() => playSong(s, filtered, "Thư viện nhạc")} />
        ))}
      </div>
    </div>
  );
}
