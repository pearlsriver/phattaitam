import Link from "next/link";
import CoverImage from "@/components/ui/CoverImage";
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

/** Thẻ dạng "bìa sách": có ảnh bìa thì hiện nguyên ảnh (vừa khung, không cắt), không có thì bìa màu kèm tên sách */
export default function BookCard({ post }: { post: Post }) {
  const [c1, c2] = coverColors(post.slug);
  const label = post.tags[0] ? `#${post.tags[0]}` : post.file_path ? "Sách" : "Bài viết";
  return (
    <Link href={`/bai-viet/${post.slug}`} className="group block">
      <div
        className="book-cover relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-l-sm rounded-r-xl p-3 text-white transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-2xl sm:p-4"
        style={{ "--c1": c1, "--c2": c2 } as React.CSSProperties}
      >
        {post.cover_image ? (
          <>
            <CoverImage src={post.cover_image} className="absolute inset-0 !bg-transparent" />
            <span className="absolute inset-y-0 left-0 w-1.5 bg-black/25" aria-hidden />
            <span className="relative self-start rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] tracking-wide backdrop-blur-sm">{label}</span>
          </>
        ) : (
          <>
            <span className="relative self-start rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] tracking-wide">{label}</span>
            <span className="relative line-clamp-4 font-serif text-base font-semibold leading-snug drop-shadow sm:text-lg">{post.title}</span>
          </>
        )}
      </div>
      <div className="mt-2.5 sm:mt-3">
        <p className="line-clamp-2 text-sm font-medium text-ink sm:text-base">{post.title}</p>
        <p className="line-clamp-1 text-xs text-muted sm:text-sm">Tác giả: {authorLabel(post)}</p>
        <p className="mt-1 text-xs font-medium text-accent">
          {post.file_path ? "📎 Có tệp" : "Đọc online"} · 👁 {formatCount(post.view_count)}
        </p>
      </div>
    </Link>
  );
}
