import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { serverSupabase } from "@/lib/supabaseServer";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = serverSupabase();
  const fixed = ["", "/thu-vien", "/sach", "/nhac", "/album", "/dieu-le"].map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));

  const [posts, songs, albums] = await Promise.all([
    sb.from("posts").select("slug, updated_at").eq("is_published", true).limit(5000),
    sb.from("songs").select("id, updated_at").eq("is_published", true).limit(5000),
    // Đĩa đơn không có trang riêng → không đưa vào sitemap
    sb.from("albums").select("id, updated_at").eq("is_solo", false).limit(1000),
  ]);

  return [
    ...fixed,
    ...(posts.data ?? []).map((p: { slug: string; updated_at: string }) => ({ url: `${SITE_URL}/bai-viet/${p.slug}`, lastModified: p.updated_at, priority: 0.7 })),
    ...(songs.data ?? []).map((s: { id: string; updated_at: string }) => ({ url: `${SITE_URL}/bai-hat/${s.id}`, lastModified: s.updated_at, priority: 0.6 })),
    ...(albums.data ?? []).map((a: { id: string; updated_at: string }) => ({ url: `${SITE_URL}/album/${a.id}`, lastModified: a.updated_at, priority: 0.6 })),
  ];
}
