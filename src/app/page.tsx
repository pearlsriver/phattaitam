"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BookCard, { COVER_COLORS } from "@/components/posts/BookCard";
import PostCard from "@/components/posts/PostCard";
import AlbumCard from "@/components/music/AlbumCard";
import { usePosts } from "@/hooks/usePosts";
import { useSongs } from "@/hooks/useSongs";
import { usePlayer } from "@/components/music/PlayerProvider";
import { listAlbums } from "@/services/albumService";
import type { Album } from "@/types/album";
import { CATEGORIES } from "@/types/post";

export default function HomePage() {
  const { posts, loading } = usePosts(undefined, 30);
  const { songs } = useSongs();
  const { startRadio } = usePlayer();
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    listAlbums().then((a) => setAlbums(a.slice(0, 4))).catch(() => {});
  }, []);

  const books = posts.filter((p) => p.file_path);
  const featured = (books.length ? books : posts).slice(0, 4);
  const community = posts.filter((p) => !p.file_path).slice(0, 3);
  const nowReading = featured[0];

  return (
    <div className="space-y-20">
      <section className="hero-glow grid items-center gap-10 overflow-hidden rounded-[2rem] border border-line px-6 py-14 md:grid-cols-[1.3fr_1fr] md:px-12">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">Ngôi nhà mới cho tâm hồn ham học</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-ink md:text-6xl">
            Đọc. Nghe.
            <br />
            <span className="italic text-accent">Sáng tạo.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-ink-soft">
            Thư viện số nơi sách, âm nhạc, ý tưởng và sáng tác của cộng đồng cùng hội tụ.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/thu-vien" className="rounded-full bg-ink px-6 py-3 font-medium text-paper hover:opacity-90">Khám phá thư viện →</Link>
            <Link href="/nhac" className="rounded-full border border-line bg-surface px-6 py-3 font-medium text-ink hover:bg-soft">Mở Nhạc</Link>
          </div>
          <dl className="mt-10 flex gap-10">
            <div>
              <dt className="font-serif text-3xl font-semibold text-ink">{posts.length}</dt>
              <dd className="text-sm text-muted">sách &amp; bài viết</dd>
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
          <div className="absolute -inset-4 rotate-3 rounded-3xl bg-accent-soft" />
          <div className="relative rounded-3xl border border-line bg-surface p-5 shadow-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Đang đọc</p>
            {nowReading ? (
              <Link href={`/bai-viet/${nowReading.slug}`} className="mt-3 block">
                <div
                  className="book-cover flex aspect-[3/4] items-end rounded-l-sm rounded-r-xl p-5 text-white"
                  style={{ "--c1": COVER_COLORS[nowReading.category][0], "--c2": COVER_COLORS[nowReading.category][1] } as React.CSSProperties}
                >
                  <span className="font-serif text-2xl font-semibold leading-snug drop-shadow">{nowReading.title}</span>
                </div>
                <p className="mt-3 font-medium text-ink">{nowReading.title}</p>
                <p className="text-sm text-muted">{CATEGORIES[nowReading.category].label} · {nowReading.author?.full_name ?? "Ẩn danh"}</p>
              </Link>
            ) : (
              <div className="book-cover mt-3 flex aspect-[3/4] items-end rounded-l-sm rounded-r-xl p-5 text-white"
                style={{ "--c1": "#6b4a12", "--c2": "#e0b75a" } as React.CSSProperties}>
                <span className="font-serif text-2xl font-semibold">Phật Tại Tâm</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Thư viện</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">Sách nổi bật</h2>
          </div>
          <Link href="/thu-vien" className="text-sm font-medium text-accent hover:underline">Xem tất cả →</Link>
        </div>
        {loading ? (
          <p className="text-muted">Đang tải…</p>
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{featured.map((p) => <BookCard key={p.id} post={p} />)}</div>
        ) : (
          <p className="text-muted">Chưa có sách nào.</p>
        )}
      </section>

      <section className="grid items-center gap-8 rounded-[2rem] bg-ink px-8 py-12 text-paper md:grid-cols-[1.4fr_1fr] md:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] opacity-70">Âm nhạc</p>
          <h2 className="mt-2 font-serif text-4xl font-semibold">Nghe trong lúc đọc</h2>
          <p className="mt-3 max-w-md opacity-80">Giai điệu cho sự chú tâm tĩnh lặng. Thiền ca, nhạc thư giãn và radio — luôn sẵn sàng từ trình phát cố định.</p>
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <button type="button" onClick={() => startRadio(songs)} disabled={!songs.length}
            className="flex items-center gap-3 rounded-full bg-paper px-6 py-3 font-medium text-ink hover:opacity-90 disabled:opacity-50">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-paper">▶</span>
            Phát Radio Phật Tại Tâm
          </button>
          <Link href="/nhac" className="text-sm underline opacity-80 hover:opacity-100">Mở thư viện nhạc</Link>
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

      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Cộng đồng</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold text-ink">Sáng tác cộng đồng</h2>
            <p className="mt-1 text-ink-soft">Truyện, tản văn và suy niệm do các thành viên chia sẻ.</p>
          </div>
          <Link href="/cong-dong" className="text-sm font-medium text-accent hover:underline">Khám phá →</Link>
        </div>
        {community.length ? (
          <div className="grid gap-6 md:grid-cols-3">{community.map((p) => <PostCard key={p.id} post={p} />)}</div>
        ) : (
          <p className="text-muted">Chưa có bài viết cộng đồng.</p>
        )}
      </section>
    </div>
  );
}
