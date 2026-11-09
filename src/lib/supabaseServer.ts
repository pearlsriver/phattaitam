import { createClient } from "@supabase/supabase-js";

/** Client chỉ dùng phía máy chủ (SEO, sitemap). Chỉ đọc dữ liệu công khai. */
export function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "missing-key",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function serverPublicUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
