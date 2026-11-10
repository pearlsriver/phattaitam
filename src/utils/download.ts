import { MEDIA_URL } from "@/lib/supabase";
import { imagePathFromUrl } from "@/utils/storagePaths";
import { removeVietnameseTones } from "@/utils/slug";

function extOf(path: string): string {
  const m = path.split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : "jpg";
}

/** Tên tệp tải về: "Hơi Ấm Quê Mình" -> "Hoi-Am-Que-Minh-bia.jpg" */
export function coverFileName(title: string, path: string): string {
  const base = removeVietnameseTones(title).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "bia";
  return `${base}-bia.${extOf(path)}`;
}

/**
 * Địa chỉ tải ảnh bìa của BÀI VIẾT / SÁCH (ảnh lưu dưới dạng URL đầy đủ trong kho "images").
 * Trình duyệt sẽ tải về thay vì mở ảnh.
 */
export function imageDownloadHref(url: string, title: string): string {
  const name = coverFileName(title, url);
  const path = imagePathFromUrl(url);
  if (path && MEDIA_URL) {
    return `/api/media/download?key=${encodeURIComponent(`images/${path}`)}&name=${encodeURIComponent(name)}`;
  }
  // Ảnh cũ còn ở Supabase Storage: Supabase hỗ trợ ?download=<tên tệp>
  if (path) return `${url}${url.includes("?") ? "&" : "?"}download=${encodeURIComponent(name)}`;
  return url;
}
