import { createClient } from "@supabase/supabase-js";
import { encodePathClient } from "@/utils/storagePaths";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !key) {
  console.warn("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local");
}

export const supabase = createClient(url || "http://localhost:54321", key || "missing-key", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});

export type Bucket = "books" | "music" | "covers" | "images";

/** Địa chỉ công khai của Cloudflare R2, ví dụ https://media.phattaitam.com (để trống = dùng Supabase Storage) */
export const MEDIA_URL = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");

/**
 * URL công khai của tệp.
 * - download=true hoặc tên tệp: trình duyệt tải về thay vì mở.
 */
export function publicUrl(bucket: Bucket, path: string, download?: boolean | string): string {
  if (MEDIA_URL) {
    if (download) {
      const q = new URLSearchParams({ key: `${bucket}/${path}` });
      if (typeof download === "string") q.set("name", download);
      return `/api/media/download?${q.toString()}`;
    }
    return `${MEDIA_URL}/${bucket}/${encodePathClient(path)}`;
  }
  return supabase.storage.from(bucket).getPublicUrl(path, download ? { download } : undefined).data.publicUrl;
}

export const MAX_UPLOAD_MB = 50;
