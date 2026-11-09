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
import { authorLabel, type Post } from "@/types/post";
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
        <Link href="/thu-vien" className="text-sm text-accent hover:underline">← Thư Viện</Link>
        {canEdit && <Link href={`/sua-bai/${post.id}`} className="btn btn-secondary ml-auto !py-1.5">✏️ Sửa bài</Link>}
      </div>

      {post.tags.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((t) => <Link key={t} href={`/thu-vien?tag=${encodeURIComponent(t)}`} className="chip">#{t}</Link>)}
        </div>
      )}

      <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">{post.title}</h1>
      <p className="mt-3 font-serif text-xl text-accent">Tác giả: {authorLabel(post)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
        <Link href={`/tac-gia/${post.author_id}`} className="flex items-center gap-2">
          <Avatar url={post.author?.avatar_url} name={post.author?.full_name} size={28} />
          <span>Đăng bởi <span className="font-medium text-ink hover:underline">{post.author?.full_name ?? "Ẩn danh"}</span></span>
        </Link>
        <span>· {formatDateTime(post.created_at)}</span>
        {wasEdited(post.created_at, post.updated_at) && <span>· Sửa lần cuối {formatDateTime(post.updated_at)}</span>}
        <span>· 👁 {formatCount(post.view_count)} lượt đọc</span>
        {!post.is_published && <span className="rounded bg-yellow-100 px-2 text-yellow-800">Chờ duyệt</span>}
      </div>

      {post.file_path && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="flex-1 text-ink-soft">📎 {post.file_name}</span>
          {isPdf && (
            <a href={publicUrl("books", post.file_path)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Đọc online</a>
          )}
          <a href={publicUrl("books", post.file_path, post.file_name ?? true)} className="btn btn-primary">⬇ Tải về</a>
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
