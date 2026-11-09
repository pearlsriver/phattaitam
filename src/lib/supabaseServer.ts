import { createClient } from "@supabase/supabase-js";
import { encodePathClient } from "@/utils/storagePaths";

/** Client chỉ dùng phía máy chủ (SEO, sitemap). Chỉ đọc dữ liệu công khai. */
export function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "missing-key",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** URL tuyệt đối của tệp công khai (dùng cho ảnh chia sẻ Facebook/Zalo) */
export function serverPublicUrl(bucket: string, path: string) {
  const media = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
  if (media) return `${media}/${bucket}/${encodePathClient(path)}`;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
