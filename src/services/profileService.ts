import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/profile";

export async function getPublicProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateMyProfile(userId: string, fields: { full_name: string; bio: string; avatar_url: string | null }) {
  const { error } = await supabase.from("profiles").update({
    full_name: fields.full_name.trim() || null,
    bio: fields.bio.trim() || null,
    avatar_url: fields.avatar_url,
  }).eq("id", userId);
  if (error) throw error;
}
