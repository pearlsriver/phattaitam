"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BookCard from "@/components/posts/BookCard";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, CATEGORY_KEYS, type Category } from "@/types/post";
import { matchSearch } from "@/utils/slug";

export default function LibraryPage() {
  const { posts, loading, error } = usePosts();
  const { user } = useAuth();
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "views">("new");

  const shown = useMemo(() => {
    const list = posts.filter((p) => (cat === "all" || p.category === cat) && matchSearch(`${p.title} ${p.author?.full_name ?? ""}`, q));
    return sort === "views" ? [...list].sort((a, b) => b.view_count - a.view_count) : list;
  }, [posts, cat, q, sort]);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Thư viện</p>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink">Khám phá thư viện</h1>
          <p className="mt-2 text-ink-soft">Văn, Thơ, Kinh Phật và Thiền — đọc online hoặc tải về.</p>
        </div>
        {user && <Link href="/viet-bai" className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">✍️ Viết / tải sách lên</Link>}
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        {(["all", ...CATEGORY_KEYS] as const).map((k) => (
          <button key={k} type="button" onClick={() => setCat(k)}
            className={`rounded-full px-4 py-1.5 text-sm ${cat === k ? "bg-ink text-paper" : "border border-line text-ink-soft hover:bg-soft"}`}>
            {k === "all" ? "Tất cả" : CATEGORIES[k].label}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "views")} className="field !w-auto !rounded-full !py-1.5 text-sm">
          <option value="new">Mới nhất</option>
          <option value="views">Đọc nhiều</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm tên sách, tác giả…" className="field ml-auto !w-full !rounded-full sm:!w-72" />
      </div>

      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && !shown.length && <p className="text-muted">Không có nội dung phù hợp.</p>}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">{shown.map((p) => <BookCard key={p.id} post={p} />)}</div>
    </div>
  );
}
