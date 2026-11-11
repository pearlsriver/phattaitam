const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
});

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** true nếu đã được sửa sau khi đăng (chênh hơn 1 phút) */
export function wasEdited(createdAt: string, updatedAt?: string | null): boolean {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000;
}

export function formatCount(n: number | null | undefined): string {
  const v = n ?? 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(v);
}

/** Thời lượng bài hát: 225 -> "3:45", 3725 -> "1:02:05". Trả về "" nếu chưa có. */
export function formatDuration(sec: number | null | undefined): string {
  if (!sec || !Number.isFinite(sec) || sec <= 0) return "";
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
}

/** Tổng thời lượng album: "42 phút", "1 giờ 5 phút" */
export function formatTotalDuration(sec: number): string {
  if (!sec || sec <= 0) return "";
  const totalMin = Math.round(sec / 60);
  if (totalMin < 1) return "dưới 1 phút";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} giờ${m ? ` ${m} phút` : ""}` : `${m} phút`;
}
