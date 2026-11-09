import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { serverSupabase } from "@/lib/supabaseServer";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data: p } = await serverSupabase().from("profiles").select("full_name, bio, avatar_url").eq("id", id).maybeSingle();
  if (!p) return { title: "Không tìm thấy tác giả" };
  const name = p.full_name ?? "Tác giả";
  const description = p.bio?.slice(0, 180) || `Bài viết và âm nhạc của ${name} trên Phật Tại Tâm.`;
  return {
    title: name,
    description,
    alternates: { canonical: `/tac-gia/${id}` },
    openGraph: { type: "profile", title: name, description, images: [{ url: p.avatar_url || DEFAULT_OG_IMAGE }] },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
