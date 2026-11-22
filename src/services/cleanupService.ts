import { MEDIA_URL, supabase, type Bucket } from "@/lib/supabase";
import { imagePathFromUrl, imagePathsInHtml } from "@/utils/storagePaths";

export interface StoredFile {
  bucket: Bucket;
  path: string;
  size: number;
  created_at: string | null;
}

export interface BucketReport {
  bucket: Bucket;
  label: string;
  total: number;
  totalBytes: number;
  orphans: StoredFile[];
  orphanBytes: number;
}

export const BUCKET_LABELS: Record<Bucket, string> = {
  books: "Sách / tài liệu",
  music: "Nhạc",
  covers: "Ảnh bìa (bài hát, album)",
  images: "Ảnh trong bài, ảnh đại diện & logo",
};

export const STORAGE_FREE_LIMIT = 10 * 1024 ** 3; // 10 GB — gói miễn phí Cloudflare R2

async function token() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Chưa đăng nhập.");
  return data.session.access_token;
}

async function listBucket(bucket: Bucket): Promise<StoredFile[]> {
  const res = await fetch(`/api/media/list?bucket=${bucket}`, { headers: { Authorization: `Bearer ${await token()}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Không liệt kê được tệp trên R2.");
  return (json.files as { path: string; size: number; lastModified: string | null }[]).map((f) => ({
    bucket,
    path: f.path,
    size: f.size,
    created_at: f.lastModified,
  }));
}

/**
 * Đọc HẾT mọi dòng của một bảng (theo trang 1.000 dòng — Supabase mặc định chỉ trả tối đa 1.000).
 * Chỉ cần một trang lỗi là dừng toàn bộ, tránh coi nhầm tệp đang dùng là "thừa".
 */
async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).order("created_at", { ascending: true }).range(from, from + 999);
    if (error) throw new Error(`Không đọc được bảng ${table}: ${error.message}`);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

/** Thu thập mọi tệp đang được dùng ở bất kỳ đâu trên website */
async function collectReferences(): Promise<Record<Bucket, Set<string>>> {
  const refs: Record<Bucket, Set<string>> = { books: new Set(), music: new Set(), covers: new Set(), images: new Set() };

  const [posts, songs, albums, profiles] = await Promise.all([
    fetchAll<{ content: string; file_path: string | null; cover_image: string | null }>("posts", "content, file_path, cover_image"),
    fetchAll<{ audio_path: string; cover_path: string | null }>("songs", "audio_path, cover_path"),
    fetchAll<{ cover_path: string | null }>("albums", "cover_path"),
    fetchAll<{ avatar_url: string | null }>("profiles", "avatar_url"),
  ]);
  // site_settings không có cột created_at → đọc riêng (bảng nhỏ), vẫn bắt lỗi
  const settings = await supabase.from("site_settings").select("value");
  if (settings.error) throw new Error(`Không đọc được bảng site_settings: ${settings.error.message}`);

  for (const p of posts) {
    if (p.file_path) refs.books.add(p.file_path);
    imagePathsInHtml(p.content).forEach((x) => refs.images.add(x));
    const c = imagePathFromUrl(p.cover_image);
    if (c) refs.images.add(c);
  }
  for (const s of songs) {
    refs.music.add(s.audio_path);
    if (s.cover_path) refs.covers.add(s.cover_path);
  }
  for (const a of albums) if (a.cover_path) refs.covers.add(a.cover_path);
  for (const pr of profiles) {
    const path = imagePathFromUrl(pr.avatar_url);
    if (path) refs.images.add(path);
  }
  for (const row of (settings.data ?? []) as { value: unknown }[]) {
    if (typeof row.value === "string") {
      const path = imagePathFromUrl(row.value);
      if (path) refs.images.add(path);
    }
  }
  return refs;
}

/**
 * Quét kho Cloudflare R2, tìm tệp "mồ côi" (không còn được dùng ở đâu).
 * Bỏ qua tệp mới tải lên trong `graceHours` giờ — có thể ai đó đang soạn bài.
 * Chốt an toàn: nếu hơn 50% tệp của một kho bị coi là thừa → dừng, không cho xoá.
 */
export async function scanStorage(graceHours = 24): Promise<BucketReport[]> {
  if (!MEDIA_URL) throw new Error("Chưa cấu hình NEXT_PUBLIC_MEDIA_URL (Cloudflare R2).");
  const refs = await collectReferences();
  const cutoff = Date.now() - graceHours * 3600_000;
  const buckets: Bucket[] = ["images", "covers", "books", "music"];

  return Promise.all(
    buckets.map(async (bucket) => {
      const files = await listBucket(bucket);
      const orphans = files.filter(
        (f) => !refs[bucket].has(f.path) && (!f.created_at || new Date(f.created_at).getTime() < cutoff),
      );
      if (files.length > 20 && orphans.length > files.length * 0.5) {
        throw new Error(`Kho "${BUCKET_LABELS[bucket]}": hơn 50% tệp bị coi là thừa — dừng lại để tránh xoá nhầm. Hãy báo lỗi này cho người phát triển.`);
      }
      return {
        bucket,
        label: BUCKET_LABELS[bucket],
        total: files.length,
        totalBytes: files.reduce((n, f) => n + f.size, 0),
        orphans,
        orphanBytes: orphans.reduce((n, f) => n + f.size, 0),
      };
    }),
  );
}

export async function deleteOrphans(files: StoredFile[]): Promise<number> {
  let deleted = 0;
  const t = await token();
  for (let i = 0; i < files.length; i += 200) {
    const chunk = files.slice(i, i + 200);
    const res = await fetch("/api/media/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ keys: chunk.map((f) => `${f.bucket}/${f.path}`) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Không xoá được tệp.");
    deleted += json.deleted ?? 0;
  }
  return deleted;
}

export function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}
