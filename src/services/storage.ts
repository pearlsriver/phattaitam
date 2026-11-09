import { publicUrl, supabase, type Bucket } from "@/lib/supabase";
import { safeFileName } from "@/utils/slug";
import { imagePathFromUrl } from "@/utils/storagePaths";

/** Tải file vào thư mục riêng của người dùng: <userId>/<thời gian>-<tên file> */
export async function uploadFile(bucket: Bucket, file: File, userId: string, prefix = ""): Promise<string> {
  const path = `${userId}/${prefix}${Date.now()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

/** Xoá file khỏi kho. Không báo lỗi nếu file đã mất hoặc không có quyền. */
export async function removeFiles(bucket: Bucket, paths: (string | null | undefined)[]) {
  const list = [...new Set(paths.filter((p): p is string => !!p))];
  if (!list.length) return;
  const { error } = await supabase.storage.from(bucket).remove(list);
  if (error) console.warn(`Không xoá được file trong ${bucket}:`, error.message);
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
