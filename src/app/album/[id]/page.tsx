"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SongCard from "@/components/music/SongCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import Comments from "@/components/social/Comments";
import LikeButton from "@/components/social/LikeButton";
import ShareButtons from "@/components/social/ShareButtons";
import { useAuth } from "@/hooks/useAuth";
import { albumCoverUrl, deleteAlbum, getAlbum } from "@/services/albumService";
import { listAlbumSongs } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Song } from "@/types/song";
import { formatCount } from "@/utils/formatDate";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { playSong, playList, startRadio, current } = usePlayer();
  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    Promise.all([getAlbum(id), listAlbumSongs(id)])
      .then(([a, s]) => {
        setAlbum(a);
        setSongs(s);
        setState(a ? "ok" : "notfound");
      })
      .catch(() => setState("notfound"));
  }, [id]);

  if (state === "loading") return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!album) return <p className="py-16 text-center text-ink-soft">Không tìm thấy album.</p>;

  const cover = albumCoverUrl(album);
  const canEdit = !!user && (user.id === album.owner_id || isAdmin);
  const totalPlays = songs.reduce((n, s) => n + s.play_count, 0);

  return (
    <div>
      <section className="hero-glow grid gap-8 rounded-[2rem] border border-line p-6 md:grid-cols-[16rem_1fr] md:p-10">
        <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-accent-soft shadow-xl">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">💿</div>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Album</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">{album.title}</h1>
          <p className="mt-2 text-sm text-muted">
            <Link href={`/tac-gia/${album.owner_id}`} className="hover:underline">{album.owner?.full_name ?? ""}</Link>
            {" · "}{songs.length} bài · ▶ {formatCount(totalPlays)} lượt nghe
          </p>
          {album.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-ink-soft">{album.description}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!songs.length} onClick={() => playList(songs, album.title)}
              className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper hover:opacity-90 disabled:opacity-50">
              ▶ Phát album
            </button>
            <button type="button" disabled={!songs.length} onClick={() => startRadio(songs, `Radio · ${album.title}`)}
              className="rounded-full border border-line bg-surface px-5 py-3 font-medium text-ink hover:bg-soft disabled:opacity-50">
              📻 Radio album (ngẫu nhiên)
            </button>
            <LikeButton type="album" id={album.id} />
            {canEdit && (
              <>
                <Link href={`/album/sua/${album.id}`} className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft">✏️ Sửa album</Link>
                <button type="button" className="rounded-full px-4 py-2 text-sm text-red-600 hover:bg-soft"
                  onClick={async () => {
                    if (confirm("Xoá album? Các bài hát vẫn được giữ lại.")) {
                      await deleteAlbum(album);
                      router.push("/album");
                    }
                  }}>
                  Xoá
                </button>
              </>
            )}
          </div>
          <div className="mt-4"><ShareButtons title={album.title} /></div>
        </div>
      </section>

      <section className="mt-10">
        {!songs.length && (
          <p className="text-muted">
            Album chưa có bài hát.{" "}
            {canEdit && <>Vào <Link href="/tai-nhac" className="text-accent hover:underline">Tải nhạc</Link> hoặc sửa bài hát và chọn album này.</>}
          </p>
        )}
        <div className="space-y-3">
          {songs.map((s, i) => (
            <SongCard key={s.id} song={s} trackNo={s.track_no ?? i + 1} active={current?.id === s.id}
              onPlay={() => playSong(s, songs, album.title)} />
          ))}
        </div>
      </section>

      <Comments type="album" id={album.id} />
    </div>
  );
}
