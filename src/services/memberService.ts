import { supabase } from "@/lib/supabase";
import type { Role } from "@/types/profile";

export interface Member {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  post_count: number;
  song_count: number;
}

/** Danh sách thành viên kèm email (chỉ Admin / Super Admin gọi được) */
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await supabase.rpc("admin_list_members");
  if (error) throw error;
  return ((data ?? []) as Member[]).map((m) => ({ ...m, post_count: Number(m.post_count), song_count: Number(m.song_count) }));
}

export async function setMemberRole(id: string, role: Role) {
  const { error } = await supabase.rpc("admin_set_role", { target: id, new_role: role });
  if (error) throw error;
}

export async function renameMember(id: string, name: string) {
  const { error } = await supabase.rpc("admin_update_member", { target: id, new_name: name });
  if (error) throw error;
}
