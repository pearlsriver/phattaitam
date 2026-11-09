/** Mã hoá từng đoạn của đường dẫn (giữ dấu "/") */
export function encodePathClient(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

const MEDIA = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
const LEGACY_MARKER = "/storage/v1/object/public/images/";

/** Lấy đường dẫn trong kho "images" từ URL công khai (Cloudflare R2 hoặc Supabase cũ).
 *  Trả về null nếu ảnh không thuộc kho của mình (ví dụ ảnh Google, link ngoài). */
export function imagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let path: string | null = null;

  if (MEDIA && url.startsWith(`${MEDIA}/images/`)) {
    path = url.slice(`${MEDIA}/images/`.length);
  } else {
    const i = url.indexOf(LEGACY_MARKER);
    if (i >= 0) path = url.slice(i + LEGACY_MARKER.length);
  }
  if (!path) return null;
  path = path.split(/[?#]/)[0];
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/** Tất cả ảnh (thuộc kho images) đang được dùng trong một nội dung HTML */
export function imagePathsInHtml(html: string | null | undefined): string[] {
  if (!html) return [];
  const out = new Set<string>();
  for (const m of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
    const p = imagePathFromUrl(m[1].replace(/&amp;/g, "&"));
    if (p) out.add(p);
  }
  return [...out];
}

/** Phần tử có trong a nhưng không có trong b */
export function difference(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => !set.has(x));
}
