import Link from "next/link";
import Avatar from "@/components/social/Avatar";
import { CATEGORIES, type Post } from "@/types/post";
import { formatCount, formatDate } from "@/utils/formatDate";
import { plainExcerpt } from "@/utils/html";

/** Thẻ "Sáng tác cộng đồng" */
export default function PostCard({ post }: { post: Post }) {
  const text = post.excerpt || plainExcerpt(post.content, 240);
  return (
    <Link
      href={`/bai-viet/${post.slug}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {post.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image} alt="" className="h-40 w-full object-cover" loading="lazy" />
      )}
      <div className="flex flex-1 flex-col p-6">
        <span className="self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
          {CATEGORIES[post.category]?.label}
        </span>
        <h3 className="mt-4 font-serif text-xl font-semibold text-ink">{post.title}</h3>
        {text && <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{text}</p>}
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 text-sm text-muted">
          <Avatar url={post.author?.avatar_url} name={post.author?.full_name} size={24} />
          <span className="font-medium text-ink">{post.author?.full_name ?? "Ẩn danh"}</span>
          <span>· {formatDate(post.created_at)}</span>
          <span className="ml-auto">👁 {formatCount(post.view_count)}</span>
        </div>
      </div>
    </Link>
  );
}
