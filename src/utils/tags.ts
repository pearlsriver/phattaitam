export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 30;

/** Gợi ý nhanh (thay cho các chuyên mục cũ) */
export const SUGGESTED_TAGS = ["văn", "thơ", "kinh-phật", "thiền", "lời-phật-dạy", "suy-niệm"];

/** "#Kinh Phật " -> "kinh-phật" */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_TAG_LENGTH);
}

/** Tách chuỗi nhập (phân cách bằng dấu phẩy, xuống dòng hoặc #) thành danh sách hashtag hợp lệ */
export function parseTags(input: string): string[] {
  return uniqueTags(input.split(/[,\n;#]+/).map(normalizeTag));
}

export function uniqueTags(tags: string[]): string[] {
  return [...new Set(tags.filter(Boolean))].slice(0, MAX_TAGS);
}
