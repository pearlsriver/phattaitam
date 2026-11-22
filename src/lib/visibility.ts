export type Visibility = "public" | "unlisted" | "private";

export const VISIBILITY_ORDER: Visibility[] = ["public", "unlisted", "private"];

export const VISIBILITY: Record<Visibility, { icon: string; label: string; desc: string }> = {
  public: { icon: "🌐", label: "Công khai", desc: "Mọi người đều thấy; có trong thư viện, tìm kiếm và Google." },
  unlisted: { icon: "🔗", label: "Chỉ người có link", desc: "Không hiện trong thư viện. Ai có link chia sẻ mới mở được." },
  private: { icon: "🔒", label: "Riêng tư", desc: "Chỉ bạn (và quản trị viên) xem được." },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: string | null | undefined): v is string => !!v && UUID_RE.test(v);

/** Mã chia sẻ trên thanh địa chỉ (?k=...) */
export function shareKeyFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const k = new URLSearchParams(window.location.search).get("k");
  return isUuid(k) ? k : null;
}

/** Link chia sẻ cho nội dung "Chỉ người có link" */
export function shareUrl(kind: "post" | "song", slugOrId: string, token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = kind === "post" ? `/bai-viet/${encodeURIComponent(slugOrId)}` : `/bai-hat/${slugOrId}`;
  return `${origin}${path}?k=${token}`;
}
