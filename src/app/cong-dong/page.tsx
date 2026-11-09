"use client";

import Link from "next/link";
import PostCard from "@/components/posts/PostCard";
import { usePosts } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";

export default function CommunityPage() {
  const { posts, loading, error } = usePosts();
  const { user } = useAuth();

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Cộng đồng</p>
      <div className="mb-8 mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink">Sáng tác cộng đồng</h1>
          <p className="mt-2 text-ink-soft">Truyện, tản văn, thơ và suy niệm do các thành viên chia sẻ.</p>
        </div>
        <Link href={user ? "/viet-bai" : "/login"} className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">✍️ Chia sẻ bài viết</Link>
      </div>
      {loading && <p className="text-muted">Đang tải…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && !posts.length && <p className="text-muted">Chưa có bài viết nào.</p>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
    </div>
  );
}
