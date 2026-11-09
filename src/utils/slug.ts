/** Bỏ dấu tiếng Việt: "Tâm An Lạc" -> "Tam An Lac" */
export function removeVietnameseTones(input: string): string {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

export function slugify(input: string): string {
  const base = removeVietnameseTones(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 7);
  return base ? `${base}-${suffix}` : suffix;
}

/** Tên file an toàn cho Supabase Storage */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, "") : "";
  const base = removeVietnameseTones(dot >= 0 ? name.slice(0, dot) : name)
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "file"}${ext}`;
}

export function matchSearch(haystack: string, query: string): boolean {
  const k = removeVietnameseTones(query).toLowerCase().trim();
  return !k || removeVietnameseTones(haystack).toLowerCase().includes(k);
}
