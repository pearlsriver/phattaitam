"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RichContent from "@/components/posts/RichContent";
import Avatar from "@/components/social/Avatar";
import Comments from "@/components/social/Comments";
import LikeButton from "@/components/social/LikeButton";
import ShareButtons from "@/components/social/ShareButtons";
import ShareLinkBox from "@/components/social/ShareLinkBox";
import CoverImage from "@/components/ui/CoverImage";
import VisibilityBadge from "@/components/ui/VisibilityBadge";
import { useAuth } from "@/hooks/useAuth";
import { publicUrl } from "@/lib/supabase";
import { shareKeyFromUrl, shareUrl } from "@/lib/visibility";
import { getPostBySlug } from "@/services/postService";
import { getSharedPost } from "@/services/shareService";
import { countPostView } from "@/services/socialService";
import { authorLabel, customCover, type Post } from "@/types/post";
import { imageDownloadHref } from "@/utils/download";
import { formatCount, formatDateTime, wasEdited } from "@/utils/formatDate";

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");

  useEffect(() => {
    const s = decodeURIComponent(slug);
    (async () => {
      let p = await getPostBySlug(s);
      // Bài "Chỉ người có link": mở bằng mã ?k=… trong link
      if (!p) {
        const k = shareKeyFromUrl();
        if (k) {
          const shared = await getSharedPost(k);
          if (shared && shared.slug === s) p = shared;
        }
      }
      setPost(p);
      setState(p ? "ok" : "notfound");
      if (p) document.title = `${p.title} · Phật Tại Tâm`;
      if (p?.is_published) countPostView(p.id).catch(() => {});
    })().catch(() => setState("notfound"));
  }, [slug, user?.id]);

  if (state === "loading") return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!post)
    return (
      <p className="py-16 text-center text-ink-soft">
        Không tìm thấy bài viết, hoặc bài viết không công khai.
        {!user && <> Nếu đây là bài của bạn, hãy <Link href="/login" className="text-accent hover:underline">đăng nhập</Link>.</>}
      </p>
    );

  const isPdf = post.file_path?.toLowerCase().endsWith(".pdf");
  const isOwner = !!user && user.id === post.author_id;
  const canEdit = isOwner || isAdmin;
  const cover = customCover(post);
  const vis = post.visibility ?? "public";
  const linkForShare = vis === "unlisted" ? shareUrl("post", post.slug, post.share_token) : undefined;

  const meta = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <VisibilityBadge value={vis} />
        {post.tags.map((t) => <Link key={t} href={`/thu-vien?tag=${encodeURIComponent(t)}`} className="chip">#{t}</Link>)}
      </div>
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl">{post.title}</h1>
      <p className="mt-2 font-serif text-lg text-accent sm:text-xl">Tác giả: {authorLabel(post)}</p>
    </>
  );

  return (
    <article className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/thu-vien" className="text-sm text-accent hover:underline">← Thư Viện</Link>
        {canEdit && <Link href={`/sua-bai/${post.id}`} className="btn btn-secondary ml-auto !min-h-0 !py-1.5">✏️ Sửa bài</Link>}
      </div>

      {cover ? (
        <div className="mt-5 grid items-end gap-5 sm:grid-cols-[11rem_1fr] sm:gap-7">
          <div className="mx-auto w-44 sm:mx-0 sm:w-full">
            <CoverImage src={cover} alt={`Bìa: ${post.title}`} eager className="aspect-[3/4] w-full rounded-l-sm rounded-r-xl shadow-2xl ring-1 ring-line" />
            {isAdmin && (
              <a href={imageDownloadHref(cover, post.title)} download className="btn btn-secondary mt-3 w-full !min-h-0 !py-1.5 !text-xs">⬇ Tải ảnh bìa</a>
            )}
          </div>
          <div>{meta}</div>
        </div>
      ) : (
        <div className="mt-5">{meta}</div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <Link href={`/tac-gia/${post.author_id}`} className="flex items-center gap-2">
          <Avatar url={post.author?.avatar_url} name={post.author?.full_name} size={28} />
          <span>Đăng bởi <span className="font-medium text-ink hover:underline">{post.author?.full_name ?? "Ẩn danh"}</span></span>
        </Link>
        <span>· {formatDateTime(post.created_at)}</span>
        {wasEdited(post.created_at, post.updated_at) && <span>· Sửa lần cuối {formatDateTime(post.updated_at)}</span>}
        <span>· 👁 {formatCount(post.view_count)} lượt đọc</span>
        {!post.is_published && vis !== "private" && <span className="rounded bg-yellow-100 px-2 text-yellow-800">Chờ duyệt</span>}
      </div>

      {canEdit && (
        <ShareLinkBox
          kind="post"
          id={post.id}
          slugOrId={post.slug}
          token={post.share_token}
          visibility={vis}
          published={post.is_published}
          onTokenChange={(t) => setPost({ ...post, share_token: t })}
        />
      )}

      {post.file_path && (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
          <span className="min-w-0 flex-1 break-all text-ink-soft">📎 {post.file_name}</span>
          <div className="flex gap-2">
            {isPdf && (
              <a href={publicUrl("books", post.file_path)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1 sm:flex-none">Đọc online</a>
            )}
            <a href={publicUrl("books", post.file_path, post.file_name ?? true)} className="btn btn-primary flex-1 sm:flex-none">⬇ Tải về</a>
          </div>
        </div>
      )}

      {post.content && <div className="mt-8 sm:mt-10"><RichContent content={post.content} /></div>}

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <LikeButton type="post" id={post.id} />
        {vis !== "private" && <ShareButtons title={post.title} url={linkForShare} />}
      </div>

      {post.is_published && vis !== "private" && <Comments type="post" id={post.id} />}
    </article>
  );
}
