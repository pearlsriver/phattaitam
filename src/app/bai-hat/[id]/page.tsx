"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AddToPlaylist from "@/components/music/AddToPlaylist";
import { usePlayer } from "@/components/music/PlayerProvider";
import Comments from "@/components/social/Comments";
import LikeButton from "@/components/social/LikeButton";
import ShareButtons from "@/components/social/ShareButtons";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getSongById, songCoverUrl, songDownloadUrl } from "@/services/songService";
import { formatCount, formatDateTime, wasEdited } from "@/utils/formatDate";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { playSong, current } = usePlayer();
  const { data: song, loading } = useAsync(() => getSongById(id), [id], null);

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!song) return <p className="py-16 text-center text-ink-soft">Không tìm thấy bài hát.</p>;

  const cover = songCoverUrl(song);
  const canEdit = !!user && (user.id === song.uploader_id || isAdmin);
  const playing = current?.id === song.id;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
        <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-accent-soft shadow-xl">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">🎵</div>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Bài hát</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">{song.title}</h1>
          <p className="mt-3 text-ink-soft">
            {song.artist ?? "Không rõ"}
            {song.album_info && (
              <> · Album <Link href={`/album/${song.album_info.id}`} className="text-accent hover:underline">{song.album_info.title}</Link></>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">
            ▶ {formatCount(song.play_count)} lượt nghe · Tải lên {formatDateTime(song.created_at)}
            {wasEdited(song.created_at, song.updated_at) && ` · Sửa ${formatDateTime(song.updated_at)}`}
            {!song.is_published && <span className="ml-2 rounded bg-yellow-100 px-2 text-yellow-800">Chờ duyệt</span>}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => playSong(song)}
              className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-medium text-paper hover:opacity-90">
              <span>▶</span> {playing ? "Đang phát" : "Phát"}
            </button>
            <LikeButton type="song" id={song.id} />
            <AddToPlaylist songId={song.id} />
            <a href={songDownloadUrl(song)} className="rounded-full border border-line px-4 py-2 text-sm text-ink-soft hover:bg-soft">⬇ Tải về</a>
            {canEdit && <Link href={`/sua-nhac/${song.id}`} className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft">✏️ Sửa</Link>}
          </div>
          <div className="mt-4"><ShareButtons title={song.title} /></div>
        </div>
      </div>

      <section className="mt-12 rounded-3xl border border-line bg-surface p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-ink">Lời bài hát</h2>
          {canEdit && <Link href={`/sua-nhac/${song.id}`} className="text-sm text-accent hover:underline">✏️ Sửa lời</Link>}
        </div>
        {song.lyrics ? (
          <p className="whitespace-pre-wrap font-serif text-lg leading-loose text-ink">{song.lyrics}</p>
        ) : (
          <p className="text-muted">Chưa có lời cho bài hát này.</p>
        )}
      </section>

      {song.is_published && <Comments type="song" id={song.id} />}
    </div>
  );
}
