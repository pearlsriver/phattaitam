import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !key) {
  console.warn("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local");
}

export const supabase = createClient(url || "http://localhost:54321", key || "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});

export type Bucket = "books" | "music" | "covers" | "images";

/** URL công khai của file. download=true (hoặc tên file) để trình duyệt tải về. */
export function publicUrl(bucket: Bucket, path: string, download?: boolean | string): string {
  return supabase.storage.from(bucket).getPublicUrl(path, download ? { download } : undefined).data.publicUrl;
}

export const MAX_UPLOAD_MB = 50;
