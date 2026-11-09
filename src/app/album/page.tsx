"use client";

import Link from "next/link";
import AlbumCard from "@/components/music/AlbumCard";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listAlbums } from "@/services/albumService";
import type { Album } from "@/types/album";

export default function AlbumsPage() {
  const { user } = useAuth();
  const { data: albums, loading, error } = useAsync<Album[]>(() => listAlbums(), [], []);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Âm nhạc</p>
      <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink">Album</h1>
          <p className="mt-2 text-ink-soft">Những tuyển tập nhạc — nghe trọn album hoặc bật radio theo từng album.</p>
        </div>
        {user && <Link href="/album/moi" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">＋ Tạo album</Link>}
      </div>
      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !albums.length && <p className="text-muted">Chưa có album nào.</p>}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">{albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
    </div>
  );
}
