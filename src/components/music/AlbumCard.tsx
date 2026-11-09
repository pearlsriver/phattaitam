import Link from "next/link";
import { albumCoverUrl } from "@/services/albumService";
import type { Album } from "@/types/album";

export default function AlbumCard({ album }: { album: Album }) {
  const cover = albumCoverUrl(album);
  return (
    <Link href={`/album/${album.id}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-accent-soft shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">💿</div>
        )}
      </div>
      <p className="mt-3 line-clamp-1 font-serif font-semibold text-ink">{album.title}</p>
      <p className="line-clamp-1 text-sm text-muted">{album.owner?.full_name ?? ""}</p>
    </Link>
  );
}
