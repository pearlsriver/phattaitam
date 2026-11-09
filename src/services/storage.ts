import { MEDIA_URL, publicUrl, supabase, type Bucket } from "@/lib/supabase";
import { safeFileName } from "@/utils/slug";
import { imagePathFromUrl } from "@/utils/storagePaths";

async function accessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
  return token;
}

/**
 * Tải tệp lên kho lưu trữ và trả về đường dẫn "<userId>/<thời gian>-<tên tệp>".
 * - Có NEXT_PUBLIC_MEDIA_URL: tải thẳng lên Cloudflare R2 (qua URL đã ký).
 * - Chưa có: dùng Supabase Storage như trước.
 */
export async function uploadFile(bucket: Bucket, file: File, userId: string, prefix = ""): Promise<string> {
  if (!MEDIA_URL) {
    const path = `${userId}/${prefix}${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type || undefined });
    if (error) throw error;
    return path;
  }

  const res = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}` },
    body: JSON.stringify({ bucket, filename: file.name, size: file.size, prefix }),
  });
  const info = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(info.error || "Không xin được quyền tải lên.");

  let put: Response;
  try {
    put = await fetch(info.uploadUrl, { method: "PUT", headers: { "Content-Type": info.contentType }, body: file });
  } catch {
    throw new Error("Không kết nối được Cloudflare R2. Kiểm tra cấu hình CORS của bucket.");
  }
  if (!put.ok) throw new Error(`Tải lên Cloudflare R2 thất bại (mã ${put.status}).`);
  return info.path as string;
}

/** Xoá tệp khỏi kho. Không báo lỗi nếu tệp đã mất hoặc không có quyền. */
export async function removeFiles(bucket: Bucket, paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter((p): p is string => !!p))];
  if (!list.length) return;

  if (!MEDIA_URL) {
    const { error } = await supabase.storage.from(bucket).remove(list);
    if (error) console.warn(`Không xoá được tệp trong ${bucket}:`, error.message);
    return;
  }
  try {
    const res = await fetch("/api/media/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}` },
      body: JSON.stringify({ keys: list.map((p) => `${bucket}/${p}`) }),
    });
    if (!res.ok) console.warn("Không xoá được tệp trên R2:", await res.text());
  } catch (e) {
    console.warn("Không xoá được tệp trên R2:", e);
  }
}

/** Xoá ảnh theo URL công khai (bỏ qua ảnh không thuộc kho images) */
export async function removeImageUrls(urls: (string | null | undefined)[]) {
  await removeFiles("images", urls.map(imagePathFromUrl));
}

/** Tải ảnh (trong bài viết / ảnh đại diện) và trả về URL công khai */
export async function uploadImage(file: File, userId: string, prefix = ""): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Chỉ chấp nhận tệp ảnh.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ảnh tối đa 10 MB.");
  const path = await uploadFile("images", file, userId, prefix);
  return publicUrl("images", path);
}
