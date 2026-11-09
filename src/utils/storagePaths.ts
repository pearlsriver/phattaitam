/** Lấy đường dẫn file trong bucket "images" từ URL công khai của Supabase.
 *  Trả về null nếu ảnh không thuộc kho của mình (ví dụ ảnh Google, link ngoài). */
export function imagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/storage/v1/object/public/images/";
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const path = url.slice(i + marker.length).split(/[?#]/)[0];
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
