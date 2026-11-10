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

  const sectionHead = (eyebrow: string, title: string, href: string, link: string, sub?: string) => (
    <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
        {sub && <p className="mt-1 text-sm text-ink-soft sm:text-base">{sub}</p>}
      </div>
      <Link href={href} className="shrink-0 text-sm font-medium text-accent hover:underline">{link}</Link>
    </div>
  );

  return (
    <div className="space-y-12 sm:space-y-20">
      <section className="hero-glow grid items-center gap-8 overflow-hidden rounded-3xl border border-line px-5 py-10 sm:rounded-[2rem] sm:px-6 sm:py-14 md:grid-cols-[1.3fr_1fr] md:px-12">
        <div className="order-2 text-center md:order-1 md:text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent sm:text-xs sm:tracking-[0.25em]">{SITE_TAGLINE}</p>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl md:text-6xl">
            Đọc. Nghe.
            <br />
            <span className="italic text-accent">Sáng tạo.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-ink-soft sm:mt-5 sm:text-lg md:mx-0">
            Thư viện số nơi sách, âm nhạc, ý tưởng và sáng tác của cộng đồng cùng hội tụ.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center md:justify-start">
            <Link href="/thu-vien" className="btn btn-primary !px-6 !py-3">Khám phá thư viện →</Link>
            <Link href="/nhac" className="btn btn-secondary !px-6 !py-3">Mở Nhạc</Link>
          </div>
          <dl className="mt-8 flex justify-center gap-8 sm:mt-10 sm:gap-10 md:justify-start">
            <div>
              <dt className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{posts.length}</dt>
              <dd className="text-xs text-muted sm:text-sm">bài viết &amp; sách</dd>
            </div>
            <div>
              <dt className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{songs.length}</dt>
              <dd className="text-xs text-muted sm:text-sm">bài nhạc</dd>
            </div>
            <div>
              <dt className="font-serif text-2xl font-semibold text-ink sm:text-3xl">∞</dt>
              <dd className="text-xs text-muted sm:text-sm">ý tưởng</dd>
            </div>
          </dl>
        </div>

        <div className="relative order-1 mx-auto w-40 sm:w-56 md:order-2 md:w-full md:max-w-xs">
          <div className="absolute -inset-6 rounded-full bg-accent/20 blur-3xl" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Phật Tại Tâm" width={320} height={320} className="relative mx-auto w-full rounded-full shadow-2xl ring-1 ring-line" />
        </div>
      </section>

      <section>
        {sectionHead("Sách", "Sách nổi bật", "/sach", "Xem tất cả →")}
        {loading ? (
          <p className="text-muted">Đang tải…</p>
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">{featured.map((p) => <BookCard key={p.id} post={p} />)}</div>
        ) : (
          <p className="text-muted">Chưa có sách nào.</p>
        )}
      </section>

      <section className="hero-glow grid items-center gap-6 overflow-hidden rounded-3xl border border-line px-5 py-8 sm:rounded-[2rem] sm:px-8 sm:py-12 md:grid-cols-[1.4fr_1fr] md:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Âm nhạc</p>
          <h2 className="mt-2 font-serif text-3xl font-semibold text-ink sm:text-4xl">Nghe trong lúc đọc</h2>
          <p className="mt-3 max-w-md text-sm text-ink-soft sm:text-base">Giai điệu cho sự chú tâm tĩnh lặng. Thiền ca, nhạc thư giãn và Radio — luôn sẵn sàng từ trình phát cố định.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <button type="button" onClick={radio} disabled={!songs.length || radioBusy} className="btn btn-primary !px-6 !py-3">
            <RadioIcon size={18} /> {radioBusy ? "Đang tải…" : "Phát Radio Phật Tại Tâm"}
          </button>
          <Link href="/nhac" className="text-center text-sm text-accent hover:underline">Mở thư viện nhạc</Link>
        </div>
      </section>

      {albums.length > 0 && (
        <section>
          {sectionHead("Âm nhạc", "Album", "/album", "Tất cả →")}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">{albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
        </section>
      )}

      {latest.length > 0 && (
        <section>
          {sectionHead("Thư viện", "Mới đăng", "/thu-vien", "Khám phá →", "Bài viết, văn thơ và suy niệm do các thành viên chia sẻ.")}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
        </section>
      )}
    </div>
  );
}
