"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SongCard from "@/components/music/SongCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import Comments from "@/components/social/Comments";
import LikeButton from "@/components/social/LikeButton";
import ShareButtons from "@/components/social/ShareButtons";
import CoverImage from "@/components/ui/CoverImage";
import { useAuth } from "@/hooks/useAuth";
import { publicUrl } from "@/lib/supabase";
import { albumCoverPath, albumCoverUrl, deleteAlbum, getAlbum, soloSongId } from "@/services/albumService";
import { listAlbumSongs } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Song } from "@/types/song";
import { coverFileName } from "@/utils/download";
import { formatCount, formatTotalDuration } from "@/utils/formatDate";

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { playSong, playList, current } = usePlayer();
  const [album, setAlbum] = useState<Album | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    Promise.all([getAlbum(id), listAlbumSongs(id)])
      .then(([a, s]) => {
        // Đĩa đơn không có trang riêng: chuyển thẳng sang trang bài hát
        const sid = a ? soloSongId(a) : null;
        if (sid) {
          router.replace(`/bai-hat/${sid}`);
          return;
        }
        setAlbum(a);
        setSongs(s);
        setState(a ? "ok" : "notfound");
      })
      .catch(() => setState("notfound"));
  }, [id, router]);

  if (state === "loading") return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!album) return <p className="py-16 text-center text-ink-soft">Không tìm thấy album.</p>;

  const cover = albumCoverUrl(album);
  const coverPath = albumCoverPath(album);
  // Tải ảnh bìa: chỉ dành cho quản trị viên
  const coverDownload = isAdmin && coverPath ? publicUrl("covers", coverPath, coverFileName(album.title, coverPath)) : null;
  const canEdit = !!user && (user.id === album.owner_id || isAdmin);
  const totalPlays = songs.reduce((n, s) => n + s.play_count, 0);
  const totalDur = formatTotalDuration(songs.reduce((n, s) => n + (s.duration_seconds ?? 0), 0));

  return (
    <div>
      <section className="hero-glow grid gap-6 rounded-3xl border border-line p-5 sm:rounded-[2rem] md:grid-cols-[16rem_1fr] md:gap-8 md:p-10">
        <div className="mx-auto w-52 md:w-full">
          <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-accent-soft shadow-xl">
            {cover ? (
              <CoverImage src={cover} alt={`Bìa ${album.title}`} eager className="h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/logo.png" alt="Phật Tại Tâm" className="h-full w-full object-contain p-6" />
            )}
          </div>
          {coverDownload && (
            <a href={coverDownload} download className="btn btn-secondary mt-3 w-full !min-h-0 !py-1.5 !text-xs">⬇ Tải ảnh bìa</a>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Album</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl">{album.title}</h1>
          <p className="mt-2 text-sm text-muted">
            <Link href={`/tac-gia/${album.owner_id}`} className="hover:underline">{album.owner?.full_name ?? ""}</Link>
            {" · "}{songs.length} bài
            {totalDur && ` · ${totalDur}`} · ▶ {formatCount(totalPlays)} lượt nghe
          </p>
          {album.description && <p className="mt-4 max-w-2xl whitespace-pre-line text-ink-soft">{album.description}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!songs.length} onClick={() => playList(songs, album.title)} className="btn btn-primary !px-6 !py-3">
              ▶ Phát album
            </button>
            <LikeButton type="album" id={album.id} />
            {canEdit && (
              <>
                <Link href={`/album/sua/${album.id}`} className="btn btn-secondary">✏️ Sửa album</Link>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={async () => {
                    if (confirm("Xoá album? Các bài hát vẫn được giữ lại (tự thành Đĩa đơn).")) {
                      await deleteAlbum(album);
                      router.push("/album");
                    }
                  }}
                >
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
        <div className="space-y-2.5 sm:space-y-3">
          {songs.map((s, i) => (
            <SongCard key={s.id} song={s} trackNo={s.track_no ?? i + 1} active={current?.id === s.id} onPlay={() => playSong(s, songs, album.title)} />
          ))}
        </div>
      </section>

      <Comments type="album" id={album.id} />
    </div>
  );
}
