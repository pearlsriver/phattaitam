"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import BookCard from "@/components/posts/BookCard";
import PostCard from "@/components/posts/PostCard";
import { EditableText as T } from "@/components/site/Editable";
import SiteLogo from "@/components/site/SiteLogo";
import { RadioIcon } from "@/components/ui/Icons";
import { usePosts } from "@/hooks/usePosts";
import { useSongs } from "@/hooks/useSongs";
import type { TextKey } from "@/lib/siteContent";
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

  const sectionHead = (eyebrow: TextKey, title: TextKey, href: string, link: TextKey, sub?: TextKey) => (
    <div className="mb-5 flex items-end justify-between gap-3 sm:mb-6">
      <div className="min-w-0">
        <T as="p" k={eyebrow} label="Nhãn nhỏ của mục" className="block text-xs uppercase tracking-[0.2em] text-muted" />
        <T as="h2" k={title} label="Tiêu đề mục" className="mt-1 block font-serif text-2xl font-semibold text-ink sm:text-3xl" />
        {sub && <T as="p" k={sub} multiline label="Mô tả mục" className="mt-1 block text-sm text-ink-soft sm:text-base" />}
      </div>
      <Link href={href} className="shrink-0 text-sm font-medium text-accent hover:underline"><T k={link} label="Liên kết của mục" /></Link>
    </div>
  );

  return (
    <div className="space-y-12 sm:space-y-20">
      <section className="hero-glow grid items-center gap-8 overflow-hidden rounded-3xl border border-line px-5 py-10 sm:rounded-[2rem] sm:px-6 sm:py-14 md:grid-cols-[1.3fr_1fr] md:px-12">
        <div className="order-2 text-center md:order-1 md:text-left">
          <T as="p" k="site.tagline" label="Khẩu hiệu trang chủ"
            className="block text-[11px] font-medium uppercase tracking-[0.2em] text-accent sm:text-xs sm:tracking-[0.25em]" />
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl md:text-6xl">
            <T k="home.heroTitle1" label="Tiêu đề lớn — dòng 1" />
            <br />
            <T k="home.heroTitle2" label="Tiêu đề lớn — dòng 2" className="italic text-accent" />
          </h1>
          <T as="p" k="home.heroDesc" multiline label="Trang chủ — đoạn giới thiệu"
            className="mx-auto mt-4 block max-w-lg whitespace-pre-line text-base text-ink-soft sm:mt-5 sm:text-lg md:mx-0" />
          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:justify-center md:justify-start">
            <Link href="/thu-vien" className="btn btn-primary !px-6 !py-3"><T k="home.ctaLibrary" label="Nút Khám phá thư viện" /></Link>
            <Link href="/nhac" className="btn btn-secondary !px-6 !py-3"><T k="home.ctaMusic" label="Nút Mở Nhạc" /></Link>
          </div>
          <dl className="mt-8 flex justify-center gap-8 sm:mt-10 sm:gap-10 md:justify-start">
            <div>
              <dt className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{posts.length}</dt>
              <dd className="text-xs text-muted sm:text-sm"><T k="home.statPosts" label="Số liệu — bài viết" /></dd>
            </div>
            <div>
              <dt className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{songs.length}</dt>
              <dd className="text-xs text-muted sm:text-sm"><T k="home.statSongs" label="Số liệu — bài nhạc" /></dd>
            </div>
            <div>
              <dt className="font-serif text-2xl font-semibold text-ink sm:text-3xl">∞</dt>
              <dd className="text-xs text-muted sm:text-sm"><T k="home.statIdeas" label="Số liệu — ý tưởng" /></dd>
            </div>
          </dl>
        </div>

        <div className="relative order-1 mx-auto w-40 sm:w-56 md:order-2 md:w-full md:max-w-xs">
          <div className="absolute -inset-6 rounded-full bg-accent/20 blur-3xl" />
          <SiteLogo size="lg" className="relative mx-auto aspect-square w-full rounded-full shadow-2xl ring-1 ring-line" />
        </div>
      </section>

      <section>
        {sectionHead("home.booksEyebrow", "home.booksTitle", "/sach", "home.booksLink")}
        {loading ? (
          <p className="text-muted">Đang tải…</p>
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">{featured.map((p) => <BookCard key={p.id} post={p} />)}</div>
        ) : (
          <T as="p" k="home.booksEmpty" label="Khi chưa có sách" className="text-muted" />
        )}
      </section>

      <section className="hero-glow grid items-center gap-6 overflow-hidden rounded-3xl border border-line px-5 py-8 sm:rounded-[2rem] sm:px-8 sm:py-12 md:grid-cols-[1.4fr_1fr] md:px-12">
        <div>
          <T as="p" k="home.musicEyebrow" label="Khối Âm nhạc — nhãn nhỏ" className="block text-xs uppercase tracking-[0.25em] text-accent" />
          <T as="h2" k="home.musicTitle" label="Khối Âm nhạc — tiêu đề" className="mt-2 block font-serif text-3xl font-semibold text-ink sm:text-4xl" />
          <T as="p" k="home.musicDesc" multiline label="Khối Âm nhạc — mô tả" className="mt-3 block max-w-md whitespace-pre-line text-sm text-ink-soft sm:text-base" />
        </div>
        <div className="flex flex-col gap-3 md:items-end">
          <button type="button" onClick={radio} disabled={!songs.length || radioBusy} className="btn btn-primary !px-6 !py-3">
            <RadioIcon size={18} /> {radioBusy ? "Đang tải…" : <T k="home.radioButton" label="Nút Radio" />}
          </button>
          <Link href="/nhac" className="text-center text-sm text-accent hover:underline"><T k="home.musicLink" label="Liên kết thư viện nhạc" /></Link>
        </div>
      </section>

      {albums.length > 0 && (
        <section>
          {sectionHead("home.albumsEyebrow", "home.albumsTitle", "/album", "home.albumsLink")}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">{albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
        </section>
      )}

      {latest.length > 0 && (
        <section>
          {sectionHead("home.latestEyebrow", "home.latestTitle", "/thu-vien", "home.latestLink", "home.latestDesc")}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">{latest.map((p) => <PostCard key={p.id} post={p} />)}</div>
        </section>
      )}
    </div>
  );
}
