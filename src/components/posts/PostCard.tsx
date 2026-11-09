import Link from "next/link";
import Avatar from "@/components/social/Avatar";
import type { Post } from "@/types/post";
import { authorLabel } from "@/types/post";
import { formatCount, formatDate } from "@/utils/formatDate";
import { plainExcerpt } from "@/utils/html";

/** Thẻ bài viết: hashtag, tác giả, người đăng */
export default function PostCard({ post }: { post: Post }) {
  const text = post.excerpt || plainExcerpt(post.content, 240);
  return (
    <Link
      href={`/bai-viet/${post.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl"
    >
      {post.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}
      <div className="flex flex-1 flex-col p-6">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        )}
        <h3 className="mt-3 font-serif text-xl font-semibold text-ink">{post.title}</h3>
        <p className="mt-1 text-sm font-medium text-accent">Tác giả: {authorLabel(post)}</p>
        {text && <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{text}</p>}
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
          <Avatar url={post.author?.avatar_url} name={post.author?.full_name} size={22} />
          <span>Đăng bởi {post.author?.full_name ?? "Ẩn danh"} · {formatDate(post.created_at)}</span>
          <span className="ml-auto">👁 {formatCount(post.view_count)}</span>
        </div>
      </div>
    </Link>
  );
}
