import { supabase } from "@/lib/supabase";
import { isUuid } from "@/lib/visibility";
import type { Post } from "@/types/post";
import type { Song } from "@/types/song";

/** Mở bài viết "Chỉ người có link" bằng mã trong link */
export async function getSharedPost(token: string): Promise<Post | null> {
  if (!isUuid(token)) return null;
  const { data, error } = await supabase.rpc("get_shared_post", { p_token: token });
  if (error) throw error;
  return (data as Post | null) ?? null;
}

/** Mở bài hát "Chỉ người có link" bằng mã trong link */
export async function getSharedSong(token: string): Promise<Song | null> {
  if (!isUuid(token)) return null;
  const { data, error } = await supabase.rpc("get_shared_song", { p_token: token });
  if (error) throw error;
  const s = (data as Song | null) ?? null;
  return s && s.album_info?.is_solo ? { ...s, album_info: { ...s.album_info, title: "Đĩa đơn" } } : s;
}

/** Tạo link chia sẻ mới (link cũ hết hiệu lực) */
export async function regenerateShareToken(kind: "post" | "song", id: string): Promise<string> {
  const { data, error } = await supabase.rpc("regenerate_share_token", { p_kind: kind, p_id: id });
  if (error) throw error;
  return data as string;
}
