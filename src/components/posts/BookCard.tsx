import Link from "next/link";
import type { Post } from "@/types/post";
import { authorLabel } from "@/types/post";
import { formatCount } from "@/utils/formatDate";

const PALETTES: [string, string][] = [
  ["#7a4a14", "#d9a441"],
  ["#6b3a2e", "#d98c6b"],
  ["#2f5a4f", "#8cc3a8"],
  ["#3b3f6b", "#9aa3e0"],
  ["#6b4a12", "#e0b75a"],
  ["#5a2f4a", "#d98cb8"],
];

export function coverColors(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

/** Thẻ dạng "bìa sách" */
export default function BookCard({ post }: { post: Post }) {
  const [c1, c2] = coverColors(post.slug);
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div
        className="book-cover relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-l-sm rounded-r-xl p-4 text-white transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl"
        style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
      >
        {post.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-luminosity" />
        )}
        <span className="relative self-start rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] tracking-wide">
          {post.tags[0] ? `#${post.tags[0]}` : post.file_path ? "Sách" : "Bài viết"}
        </span>
        <span className="relative line-clamp-4 font-serif text-lg font-semibold leading-snug drop-shadow">{post.title}</span>
      </div>
      <div className="mt-3">
        <p className="line-clamp-1 font-medium text-ink">{post.title}</p>
        <p className="line-clamp-1 text-sm text-muted">Tác giả: {authorLabel(post)}</p>
        <p className="mt-1 text-xs font-medium text-accent">
          {post.file_path ? "📎 Có tệp tải về" : "Đọc online"} · 👁 {formatCount(post.view_count)}
        </p>
      </div>
    </Link>
  );
}
