"use client";

import Link from "next/link";
import BookCard from "@/components/posts/BookCard";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, CATEGORY_KEYS, type Category } from "@/types/post";

export default function CategoryPage({ category }: { category: Category }) {
  const { posts, loading, error } = usePosts(category);
  const { user } = useAuth();
  const info = CATEGORIES[category];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Thư viện</p>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink">{info.label}</h1>
          <p className="mt-2 text-ink-soft">{info.description}</p>
        </div>
        {user && (
          <Link href={`/viet-bai?category=${category}`} className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">
            ✍️ Viết / tải lên
          </Link>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Link href="/thu-vien" className="rounded-full border border-line px-4 py-1.5 text-sm text-ink-soft hover:bg-soft">Tất cả</Link>
        {CATEGORY_KEYS.map((k) => (
          <Link key={k} href={`/${k}`}
            className={`rounded-full px-4 py-1.5 text-sm ${k === category ? "bg-ink text-paper" : "border border-line text-ink-soft hover:bg-soft"}`}>
            {CATEGORIES[k].label}
          </Link>
        ))}
      </div>

      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && posts.length === 0 && <p className="text-muted">Chưa có nội dung trong mục này.</p>}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((p) => <BookCard key={p.id} post={p} />)}
      </div>
    </div>
  );
}
