"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import AddToPlaylist from "@/components/music/AddToPlaylist";
import { usePlayer } from "@/components/music/PlayerProvider";
import Comments from "@/components/social/Comments";
import LikeButton from "@/components/social/LikeButton";
import ShareButtons from "@/components/social/ShareButtons";
import CoverImage from "@/components/ui/CoverImage";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { publicUrl } from "@/lib/supabase";
import { getSongById, songCoverPath, songCoverUrl, songDownloadUrl } from "@/services/songService";
import { coverFileName } from "@/utils/download";
import { formatCount, formatDateTime, formatDuration, wasEdited } from "@/utils/formatDate";

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const { playSong, current } = usePlayer();
  const { data: song, loading } = useAsync(() => getSongById(id), [id], null);

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!song) return <p className="py-16 text-center text-ink-soft">Không tìm thấy bài hát.</p>;

  const cover = songCoverUrl(song);
  const coverPath = songCoverPath(song);
  // Tải ảnh bìa: chỉ dành cho quản trị viên
  const coverDownload = isAdmin && coverPath ? publicUrl("covers", coverPath, coverFileName(song.title, coverPath)) : null;
  const canEdit = !!user && (user.id === song.uploader_id || isAdmin);
  const playing = current?.id === song.id;
  const solo = !!song.album_info?.is_solo;
  const dur = formatDuration(song.duration_seconds);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-6 md:grid-cols-[16rem_1fr] md:gap-8">
        <div className="mx-auto w-56 md:w-full">
          <div className="aspect-square overflow-hidden rounded-3xl border border-line bg-accent-soft shadow-xl">
            {cover ? (
              <CoverImage src={cover} alt={song.title} eager className="h-full w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/logo.png" alt="" className="h-full w-full object-contain p-6" />
            )}
          </div>
          {coverDownload && (
            <a href={coverDownload} download className="btn btn-secondary mt-3 w-full !min-h-0 !py-1.5 !text-xs">⬇ Tải ảnh bìa</a>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{solo ? "Đĩa đơn" : "Bài hát"}</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl">{song.title}</h1>
          <p className="mt-3 text-ink-soft">
            {song.artist ?? "Không rõ"}
            {/* Đĩa đơn: không hiện liên kết. Bài thuộc album: liên kết tới album. */}
            {song.album_info && !solo && (
              <>
                {" · "}Album{" "}
                <Link href={`/album/${song.album_info.id}`} className="text-accent hover:underline">{song.album_info.title}</Link>
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-muted">
            {dur && `⏱ ${dur} · `}▶ {formatCount(song.play_count)} lượt nghe · Tải lên {formatDateTime(song.created_at)}
            {wasEdited(song.created_at, song.updated_at) && ` · Sửa ${formatDateTime(song.updated_at)}`}
            {!song.is_published && <span className="ml-2 rounded bg-yellow-100 px-2 text-yellow-800">Chờ duyệt</span>}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => playSong(song)} className="btn btn-primary !px-6 !py-3">
              <span>▶</span> {playing ? "Đang phát" : "Phát"}
            </button>
            <LikeButton type="song" id={song.id} />
            <AddToPlaylist songId={song.id} />
            <a href={songDownloadUrl(song)} className="btn btn-secondary">⬇ Tải về</a>
            {canEdit && <Link href={`/sua-nhac/${song.id}`} className="btn btn-secondary">✏️ Sửa</Link>}
          </div>
          <div className="mt-4"><ShareButtons title={song.title} /></div>
        </div>
      </div>

      <section className="mt-10 rounded-3xl border border-line bg-surface p-5 sm:mt-12 sm:p-8">
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
