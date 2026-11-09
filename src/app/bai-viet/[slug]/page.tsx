"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RichContent from "@/components/posts/RichContent";
import Avatar from "@/components/social/Avatar";
import Comments from "@/components/social/Comments";
import LikeButton from "@/components/social/LikeButton";
import ShareButtons from "@/components/social/ShareButtons";
import { useAuth } from "@/hooks/useAuth";
import { publicUrl } from "@/lib/supabase";
import { getPostBySlug } from "@/services/postService";
import { countPostView } from "@/services/socialService";
import { CATEGORIES, type Post } from "@/types/post";
import { formatCount, formatDateTime, wasEdited } from "@/utils/formatDate";

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    getPostBySlug(decodeURIComponent(slug))
      .then((p) => {
        setPost(p);
        setState(p ? "ok" : "notfound");
        if (p?.is_published) countPostView(p.id).catch(() => {});
      })
      .catch(() => setState("notfound"));
  }, [slug]);

  if (state === "loading") return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!post) return <p className="py-16 text-center text-ink-soft">Không tìm thấy bài viết.</p>;

  const isPdf = post.file_path?.toLowerCase().endsWith(".pdf");
  const canEdit = !!user && (user.id === post.author_id || isAdmin);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/${post.category}`} className="text-sm text-accent hover:underline">← {CATEGORIES[post.category]?.label}</Link>
        {canEdit && (
          <Link href={`/sua-bai/${post.id}`} className="ml-auto rounded-full border border-line px-4 py-1.5 text-sm text-ink hover:bg-soft">✏️ Sửa bài</Link>
        )}
      </div>
      <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">{post.title}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted">
        <Link href={`/tac-gia/${post.author_id}`} className="flex items-center gap-2">
          <Avatar url={post.author?.avatar_url} name={post.author?.full_name} size={36} />
          <span className="font-medium text-ink hover:underline">{post.author?.full_name ?? "Ẩn danh"}</span>
        </Link>
        <span>· Đăng lúc {formatDateTime(post.created_at)}</span>
        {wasEdited(post.created_at, post.updated_at) && <span>· Sửa lần cuối {formatDateTime(post.updated_at)}</span>}
        <span>· 👁 {formatCount(post.view_count)} lượt đọc</span>
        {!post.is_published && <span className="rounded bg-yellow-100 px-2 text-yellow-800">Chờ duyệt</span>}
      </div>

      {post.file_path && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="flex-1 text-ink-soft">📎 {post.file_name}</span>
          {isPdf && (
            <a href={publicUrl("books", post.file_path)} target="_blank" rel="noopener noreferrer"
              className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft">Đọc online</a>
          )}
          <a href={publicUrl("books", post.file_path, post.file_name ?? true)} className="rounded-full bg-ink px-4 py-2 text-sm text-paper">⬇ Tải về</a>
        </div>
      )}

      {post.content && <div className="mt-10"><RichContent content={post.content} /></div>}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <LikeButton type="post" id={post.id} />
        <ShareButtons title={post.title} />
      </div>

      {post.is_published && <Comments type="post" id={post.id} />}
    </article>
  );
}
