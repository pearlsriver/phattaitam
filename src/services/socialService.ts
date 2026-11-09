import { supabase } from "@/lib/supabase";
import type { Comment, TargetType } from "@/types/social";

/* ---------- Yêu thích ---------- */
export async function getLikes(type: TargetType, id: string, userId?: string) {
  const countQ = supabase.from("likes").select("*", { count: "exact", head: true })
    .eq("target_type", type).eq("target_id", id);
  const [{ count }, mine] = await Promise.all([
    countQ,
    userId
      ? supabase.from("likes").select("user_id").eq("target_type", type).eq("target_id", id).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { count: count ?? 0, liked: !!mine.data };
}

export async function setLike(type: TargetType, id: string, userId: string, like: boolean) {
  const q = like
    ? supabase.from("likes").insert({ user_id: userId, target_type: type, target_id: id })
    : supabase.from("likes").delete().eq("user_id", userId).eq("target_type", type).eq("target_id", id);
  const { error } = await q;
  if (error && !(like && error.code === "23505")) throw error;
}

/* ---------- Bình luận ---------- */
export async function listComments(type: TargetType, id: string): Promise<Comment[]> {
  const { data, error } = await supabase.from("comments")
    .select("*, author:profiles(full_name, avatar_url)")
    .eq("target_type", type).eq("target_id", id)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function addComment(type: TargetType, id: string, userId: string, body: string) {
  const { error } = await supabase.from("comments")
    .insert({ user_id: userId, target_type: type, target_id: id, body: body.trim() });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw error;
}

/* ---------- Lượt đọc / lượt nghe ---------- */
function once(key: string): boolean {
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {}
  return true;
}

/** Mỗi phiên trình duyệt chỉ tính 1 lượt đọc cho mỗi bài */
export async function countPostView(postId: string) {
  if (!once(`viewed:${postId}`)) return;
  await supabase.rpc("increment_post_view", { p_id: postId });
}

/** Tính 1 lượt nghe mỗi lần bài bắt đầu phát */
export async function countSongPlay(songId: string) {
  await supabase.rpc("increment_song_play", { s_id: songId });
}
