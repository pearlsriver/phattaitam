"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BookCard from "@/components/posts/BookCard";
import { EditableText as T } from "@/components/site/Editable";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { matchSearch } from "@/utils/slug";

/** Trang duyệt bài: lọc theo hashtag, tìm kiếm, sắp xếp. mode="books": chỉ các bài có tệp sách đính kèm. */
export default function PostBrowser({ mode }: { mode: "all" | "books" }) {
  const { posts, loading, error } = usePosts();
  const { user } = useAuth();
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "views">("new");
  const p = mode === "books" ? "books" : "library";
  const page = mode === "books" ? "Trang Sách" : "Trang Thư Viện";

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tag");
    if (t) setTag(t);
  }, []);

  const base = useMemo(() => (mode === "books" ? posts.filter((x) => !!x.file_path) : posts), [posts, mode]);

  const topTags = useMemo(() => {
    const count = new Map<string, number>();
    base.forEach((x) => x.tags.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 16);
  }, [base]);

  const shown = useMemo(() => {
    const list = base.filter(
      (x) =>
        (!tag || x.tags.includes(tag)) &&
        matchSearch(`${x.title} ${x.author_name ?? ""} ${x.author?.full_name ?? ""} ${x.tags.join(" ")}`, q),
    );
    return sort === "views" ? [...list].sort((a, b) => b.view_count - a.view_count) : list;
  }, [base, tag, q, sort]);

  return (
    <div>
      <T as="p" k={`${p}.eyebrow`} label={`${page} — nhãn nhỏ`} className="block text-xs uppercase tracking-[0.2em] text-muted" />
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <T as="h1" k={`${p}.title`} label={`${page} — tiêu đề`} className="block font-serif text-3xl font-semibold text-ink sm:text-4xl" />
          <T as="p" k={`${p}.desc`} multiline label={`${page} — mô tả`} className="mt-2 block text-ink-soft" />
        </div>
        {user && <Link href="/viet-bai" className="btn btn-primary"><T k={`${p}.button`} label={`${page} — nút đăng bài`} /></Link>}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm tên, tác giả, hashtag…" className="field !w-full !rounded-full sm:!w-80" />
        <select value={sort} onChange={(e) => setSort(e.target.value as "new" | "views")} className="field !w-auto !rounded-full !py-2 text-sm">
          <option value="new">Mới nhất</option>
          <option value="views">Đọc nhiều</option>
        </select>
        {(tag || q) && <button type="button" className="btn btn-ghost !py-2" onClick={() => { setTag(null); setQ(""); }}>Xoá bộ lọc</button>}
      </div>

      {topTags.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <button type="button" className={`chip !px-3 !py-1 !text-sm ${!tag ? "chip-on" : ""}`} onClick={() => setTag(null)}>Tất cả</button>
          {topTags.map(([t, n]) => (
            <button key={t} type="button" className={`chip !px-3 !py-1 !text-sm ${tag === t ? "chip-on" : ""}`} onClick={() => setTag(tag === t ? null : t)}>
              #{t} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && !shown.length && <p className="text-muted">Không có nội dung phù hợp.</p>}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {shown.map((x) => <BookCard key={x.id} post={x} />)}
      </div>
    </div>
  );
}
