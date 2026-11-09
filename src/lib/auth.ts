import { supabase } from "@/lib/supabase";
import { TERMS_VERSION } from "@/lib/terms";
import type { Profile } from "@/types/profile";

function origin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin()}/dashboard` },
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Đăng ký bằng email — chỉ gọi sau khi người dùng đã tích đồng ý Điều lệ */
export async function signUpWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, terms_version: TERMS_VERSION },
      emailRedirectTo: `${origin()}/dashboard`,
    },
  });
  if (error) throw error;
  return !data.session;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin()}/dashboard` });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return data as Profile | null;
}

/** Ghi nhận người dùng đã đồng ý Điều lệ (giờ do máy chủ ghi) */
export async function acceptTerms() {
  const { error } = await supabase.rpc("accept_terms", { p_version: TERMS_VERSION });
  if (error) throw error;
}
