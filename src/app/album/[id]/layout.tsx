import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { serverPublicUrl, serverSupabase } from "@/lib/supabaseServer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: a } = await serverSupabase().from("albums").select("title, description, cover_path").eq("id", id).maybeSingle();
  if (!a) return { title: "Không tìm thấy album" };
  const cover = a.cover_path ? serverPublicUrl("covers", a.cover_path) : null;
  const description = a.description?.slice(0, 180) || `Nghe album “${a.title}” trên Phật Tại Tâm.`;
  const url = `/album/${id}`;
  return {
    title: `Album ${a.title}`,
    description,
    alternates: { canonical: url },
    openGraph: { type: "music.album", url, title: a.title, description, images: [{ url: cover || DEFAULT_OG_IMAGE }] },
    twitter: { card: "summary_large_image", title: a.title, description, images: [cover || DEFAULT_OG_IMAGE] },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
