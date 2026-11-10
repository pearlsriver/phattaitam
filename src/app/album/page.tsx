"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { listAlbums } from "@/services/albumService";
import type { Album } from "@/types/album";

type Kind = "all" | "album" | "single";

export default function AlbumsPage() {
  const { user } = useAuth();
  const { data: albums, loading, error } = useAsync<Album[]>(() => listAlbums({ includeSolo: true }), [], []);
  const [kind, setKind] = useState<Kind>("all");

  const shown = useMemo(
    () => albums.filter((a) => kind === "all" || (kind === "single" ? a.is_solo : !a.is_solo)),
    [albums, kind],
  );
  const counts = { all: albums.length, album: albums.filter((a) => !a.is_solo).length, single: albums.filter((a) => a.is_solo).length };

  const chip = (k: Kind, label: string) => (
    <button type="button" onClick={() => setKind(k)} className={`chip !px-3 !py-1 !text-sm ${kind === k ? "chip-on" : ""}`}>
      {label} <span className="opacity-60">{counts[k]}</span>
    </button>
  );

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Âm nhạc</p>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Album</h1>
          <p className="mt-2 text-ink-soft">Những tuyển tập nhạc và các Single — nghe trọn album hoặc bật radio theo từng album.</p>
        </div>
        {user && <Link href="/album/moi" className="btn btn-primary">＋ Tạo album</Link>}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {chip("all", "Tất cả")}
        {chip("album", "Album")}
        {chip("single", "Single")}
      </div>

      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !shown.length && <p className="text-muted">Chưa có album nào.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">{shown.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
    </div>
  );
}
