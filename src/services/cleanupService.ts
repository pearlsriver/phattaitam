import { supabase, type Bucket } from "@/lib/supabase";
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
  images: "Ảnh trong bài & ảnh đại diện",
};

/** Liệt kê toàn bộ file trong bucket (thư mục gốc là id người dùng) */
async function listBucket(bucket: Bucket): Promise<StoredFile[]> {
  const out: StoredFile[] = [];
  const page = 1000;

  async function listFolder(prefix: string) {
    for (let offset = 0; ; offset += page) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: page, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      for (const item of data ?? []) {
        const full = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) {
          await listFolder(full); // thư mục
        } else if (item.name !== ".emptyFolderPlaceholder") {
          const meta = (item.metadata ?? {}) as { size?: number };
          out.push({ bucket, path: full, size: meta.size ?? 0, created_at: item.created_at ?? null });
        }
      }
      if (!data || data.length < page) break;
    }
  }

  await listFolder("");
  return out;
}

/** Thu thập mọi file đang được dùng ở bất kỳ đâu trên website */
async function collectReferences(): Promise<Record<Bucket, Set<string>>> {
  const refs: Record<Bucket, Set<string>> = { books: new Set(), music: new Set(), covers: new Set(), images: new Set() };

  const [posts, songs, albums, profiles] = await Promise.all([
    supabase.from("posts").select("content, file_path"),
    supabase.from("songs").select("audio_path, cover_path"),
    supabase.from("albums").select("cover_path"),
    supabase.from("profiles").select("avatar_url"),
  ]);
  for (const r of [posts, songs, albums, profiles]) if (r.error) throw r.error;

  for (const p of posts.data ?? []) {
    if (p.file_path) refs.books.add(p.file_path);
    imagePathsInHtml(p.content).forEach((x) => refs.images.add(x));
  }
  for (const s of songs.data ?? []) {
    refs.music.add(s.audio_path);
    if (s.cover_path) refs.covers.add(s.cover_path);
  }
  for (const a of albums.data ?? []) if (a.cover_path) refs.covers.add(a.cover_path);
  for (const pr of profiles.data ?? []) {
    const path = imagePathFromUrl(pr.avatar_url);
    if (path) refs.images.add(path);
  }
  return refs;
}

/**
 * Quét kho lưu trữ, tìm file "mồ côi" (không còn được dùng ở đâu).
 * Bỏ qua file mới tải lên trong `graceHours` giờ — có thể ai đó đang soạn bài.
 * Chỉ admin chạy được (cần quyền đọc mọi bài viết, kể cả chưa duyệt).
 */
export async function scanStorage(graceHours = 24): Promise<BucketReport[]> {
  const refs = await collectReferences();
  const cutoff = Date.now() - graceHours * 3600_000;
  const buckets: Bucket[] = ["images", "covers", "books", "music"];

  return Promise.all(
    buckets.map(async (bucket) => {
      const files = await listBucket(bucket);
      const orphans = files.filter(
        (f) => !refs[bucket].has(f.path) && (!f.created_at || new Date(f.created_at).getTime() < cutoff),
      );
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
  const byBucket = new Map<Bucket, string[]>();
  files.forEach((f) => byBucket.set(f.bucket, [...(byBucket.get(f.bucket) ?? []), f.path]));
  for (const [bucket, paths] of byBucket) {
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { error } = await supabase.storage.from(bucket).remove(chunk);
      if (error) throw error;
      deleted += chunk.length;
    }
  }
  return deleted;
}

export function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${n} B`;
}
