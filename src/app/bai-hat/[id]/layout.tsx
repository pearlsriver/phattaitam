import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { serverPublicUrl, serverSupabase } from "@/lib/supabaseServer";

type Props = { params: Promise<{ id: string }> };

/** Supabase có thể trả quan hệ dạng object hoặc mảng — lấy phần tử đầu */
function one<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null;
  return (v as T) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: s } = await serverSupabase()
    .from("songs")
    .select("title, artist, lyrics, cover_path, album_rel:albums(title, cover_path)")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (!s) return { title: "Không tìm thấy bài hát" };

  const album = one<{ title: string; cover_path: string | null }>(s.album_rel);
  const cover = s.cover_path ? serverPublicUrl("covers", s.cover_path) : album?.cover_path ? serverPublicUrl("covers", album.cover_path) : null;
  const title = `${s.title}${s.artist ? ` — ${s.artist}` : ""}`;
  const description =
    (s.lyrics ? String(s.lyrics).replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim().slice(0, 160) : "") ||
    `Nghe “${s.title}”${album ? ` trong album ${album.title}` : ""} trên Phật Tại Tâm.`;
  const url = `/bai-hat/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "music.song", url, title, description, images: [{ url: cover || DEFAULT_OG_IMAGE }] },
    twitter: { card: "summary_large_image", title, description, images: [cover || DEFAULT_OG_IMAGE] },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
