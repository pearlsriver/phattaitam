import Link from "next/link";
import { CATEGORIES, type Category, type Post } from "@/types/post";
import { formatCount } from "@/utils/formatDate";

export const COVER_COLORS: Record<Category, [string, string]> = {
  van: ["#8a4b1a", "#d29a52"],
  tho: ["#7a3b4f", "#d98ca0"],
  "kinh-phat": ["#6b4a12", "#e0b75a"],
  thien: ["#2f5a4f", "#8cc3a8"],
};

/** Thẻ dạng "bìa sách" */
export default function BookCard({ post }: { post: Post }) {
  const [c1, c2] = COVER_COLORS[post.category] ?? COVER_COLORS.van;
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div
        className="book-cover relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-l-sm rounded-r-xl p-4 text-white transition group-hover:-translate-y-1"
        style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
      >
        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
        )}
        <span className="relative self-start rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] uppercase tracking-wider">
          {CATEGORIES[post.category]?.label}
        </span>
        <span className="relative line-clamp-4 font-serif text-lg font-semibold leading-snug drop-shadow">{post.title}</span>
      </div>
      <div className="mt-3">
        <p className="line-clamp-1 font-medium text-ink">{post.title}</p>
        <p className="line-clamp-1 text-sm text-muted">{post.author?.full_name ?? "Ẩn danh"}</p>
        <p className="mt-1 text-xs font-medium text-accent">
          {post.file_path ? "📎 Có tệp tải về" : "Đọc online"} · 👁 {formatCount(post.view_count)}
        </p>
      </div>
    </Link>
  );
}
