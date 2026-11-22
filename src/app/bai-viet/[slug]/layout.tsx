import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { serverSupabase } from "@/lib/supabaseServer";
import { firstImage, plainExcerpt } from "@/utils/html";

type Props = { params: Promise<{ slug: string }> };

function one<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return (v as T) ?? null;
}

/** Thẻ SEO + ảnh/tiêu đề khi chia sẻ link. Bài không công khai: không hiện thông tin, không cho Google lập chỉ mục. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: post } = await serverSupabase()
    .from("posts")
    .select("title, excerpt, content, cover_image, tags, author_name, created_at, updated_at, author:profiles(full_name)")
    .eq("slug", decodeURIComponent(slug))
    .eq("is_published", true)
    .eq("visibility", "public")
    .maybeSingle();

  if (!post) return { title: "Bài viết", robots: { index: false, follow: false } };

  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];
  const description = post.excerpt || plainExcerpt(post.content, 180) || "Bài viết trên Phật Tại Tâm.";
  const image = post.cover_image || firstImage(post.content);
  const author = post.author_name || one<{ full_name: string | null }>(post.author)?.full_name || undefined;
  const url = `/bai-viet/${slug}`;

  return {
    title: post.title,
    description,
    keywords: tags,
    alternates: { canonical: url },
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      authors: author ? [author] : undefined,
      tags,
      images: [{ url: image || DEFAULT_OG_IMAGE }],
    },
    twitter: { card: "summary_large_image", title: post.title, description, images: [image || DEFAULT_OG_IMAGE] },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
