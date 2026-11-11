import Link from "next/link";
import CoverImage from "@/components/ui/CoverImage";
import { albumCoverUrl, albumHref, albumSongCount } from "@/services/albumService";
import type { Album } from "@/types/album";

/** Thẻ album: ảnh bìa (chưa có thì dùng logo) + nhãn "Đĩa đơn" hoặc số bài. Đĩa đơn mở thẳng trang bài hát. */
export default function AlbumCard({ album }: { album: Album }) {
  const cover = albumCoverUrl(album);
  const count = albumSongCount(album);
  const badge = album.is_solo ? "Đĩa đơn" : count > 0 ? `${count} bài` : "Chưa có bài";

  return (
    <Link href={albumHref(album)} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-accent-soft shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
        {cover ? (
          <CoverImage src={cover} className="h-full w-full" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo.png" alt="" loading="lazy" className="h-full w-full object-contain p-4" />
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white backdrop-blur-sm">
          {badge}
        </span>
      </div>
      <p className="mt-3 line-clamp-1 font-serif font-semibold text-ink">{album.title}</p>
      <p className="line-clamp-1 text-sm text-muted">{album.owner?.full_name ?? ""}</p>
    </Link>
  );
}
