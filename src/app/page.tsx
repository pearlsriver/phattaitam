"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import BookCard from "@/components/posts/BookCard";
import PostCard from "@/components/posts/PostCard";
import { RadioIcon } from "@/components/ui/Icons";
import { usePosts } from "@/hooks/usePosts";
import { useSongs } from "@/hooks/useSongs";
import { SITE_TAGLINE } from "@/lib/site";
import { listAlbums } from "@/services/albumService";
import { loadRadioQueue } from "@/services/radioService";
import type { Album } from "@/types/album";

export default function HomePage() {
  const { posts, loading } = usePosts(40);
  const { songs } = useSongs();
  const { startRadio } = usePlayer();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [radioBusy, setRadioBusy] = useState(false);

  useEffect(() => {
    listAlbums().then((a) => setAlbums(a.slice(0, 4))).catch(() => {});
  }, []);

  const books = posts.filter((p) => p.file_path);
  const featured = (books.length ? books : posts).slice(0, 4);
  const latest = posts.filter((p) => !featured.some((f) => f.id === p.id)).slice(0, 3);

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
    <div className="space-y-20">
      <section className="hero-glow grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line px-6 py-14 md:grid-cols-[1.3fr_1fr] md:px-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">{SITE_TAGLINE}</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink md:text-6xl">
            Đọc. Nghe.
            <br />
            <span className="italic text-accent">Sáng tạo.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Thư viện số nơi sách, âm nhạc, ý tưởng và sáng tác của cộng đồng cùng hội tụ.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/thu-vien" className="btn btn-primary !px-6 !py-3">Khám phá thư viện →</Link>
            <Link href="/nhac" className="btn btn-secondary !px-6 !py-3">Mở Nhạc</Link>
          </div>
          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="font-serif text-3xl font-semibold text-ink">{posts.length}</dt>
              <dd className="text-sm text-muted">bài viết &amp; sách</dd>
            </div>
            <div>
              <dt className="font-serif text-3xl font-semibold text-ink">{songs.length}</dt>
              <dd className="text-sm text-muted">bài nhạc</dd>
            </div>
            <div>
              <dt className="font-serif text-3xl font-semibold text-ink">∞</dt>
              <dd className="text-sm text-muted">ý tưởng</dd>
            </div>
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-xs">
          <div className="absolute -inset-6 rounded-full bg-accent/20 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Phật Tại Tâm" width={320} height={320} className="relative mx-auto w-full rounded-full shadow-2xl ring-1 ring-line" />
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Sách</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">Sách nổi bật</h2>
          </div>
          <Link href="/sach" className="text-sm font-medium text-accent hover:underline">Xem tất cả →</Link>
        </div>
        {loading ? (
          <p className="text-muted">Đang tải…</p>
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{featured.map((p) => <BookCard key={p.id} post={p} />)}</div>
        ) : (
          <p className="text-muted">Chưa có sách nào.</p>
        )}
      </section>

      <section className="hero-glow grid items-center gap-8 overflow-hidden rounded-[2rem] border border-line px-8 py-12 md:grid-cols-[1.4fr_1fr] md:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Âm nhạc</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold text-ink">Nghe trong lúc đọc</h2>
          <p className="mt-3 max-w-md text-ink-soft">Giai điệu cho sự chú tâm tĩnh lặng. Thiền ca, nhạc thư giãn và Radio — luôn sẵn sàng từ trình phát cố định.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <button type="button" onClick={radio} disabled={!songs.length || radioBusy} className="btn btn-primary !px-6 !py-3">
            <RadioIcon size={18} /> {radioBusy ? "Đang tải…" : "Phát Radio Phật Tại Tâm"}
          </button>
          <Link href="/nhac" className="text-sm text-accent hover:underline">Mở thư viện nhạc</Link>
        </div>
      </section>

      {albums.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Âm nhạc</p>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">Album</h2>
            </div>
            <Link href="/album" className="text-sm font-medium text-accent hover:underline">Tất cả album →</Link>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
        </section>
      )}

      {latest.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Thư viện</p>
              <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">Mới đăng</h2>
              <p className="mt-1 text-ink-soft">Bài viết, văn thơ và suy niệm do các thành viên chia sẻ.</p>
            </div>
            <Link href="/thu-vien" className="text-sm font-medium text-accent hover:underline">Khám phá →</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
        </section>
      )}
    </div>
  );
}
