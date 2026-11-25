import { supabase, type Bucket } from "@/lib/supabase";
import { imagePathFromUrl, imagePathsInHtml } from "@/utils/storagePaths";

export const BUCKETS: Bucket[] = ["music", "covers", "books", "images"];

export const BUCKET_INFO: Record<Bucket, { icon: string; label: string }> = {
  music: { icon: "🎵", label: "Nhạc" },
  covers: { icon: "💿", label: "Ảnh bìa nhạc & album" },
  books: { icon: "📚", label: "Sách / tài liệu" },
  images: { icon: "🖼", label: "Ảnh bài viết, đại diện, logo" },
};

export interface FileUsage {
  label: string;
  href: string | null;
}

export interface ManagedFile {
  key: string; // "music/<userId>/<tệp>"
  bucket: Bucket;
  path: string; // "<userId>/<tệp>"
  name: string; // tên dễ đọc
  size: number;
  lastModified: string | null;
  ownerId: string;
  ownerName: string;
  usages: FileUsage[];
}

async function token() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Phiên đăng nhập đã hết hạn.");
  return data.session.access_token;
}

/** Đọc HẾT mọi dòng của bảng (theo trang 1.000 dòng) */
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

/** "1794240745825-Chu-Dai-Bi.mp3" -> "Chu-Dai-Bi.mp3" */
export function displayName(path: string): string {
  const file = path.split("/").pop() ?? path;
  return file.replace(/^(cover-|album-|avatar-|post-|logo-)?\d{10,}-/, "");
}

/** Xây bảng: tệp nào đang được dùng ở đâu + tên chủ sở hữu */
async function buildIndex() {
  const usage = new Map<string, FileUsage[]>();
  const add = (bucket: Bucket, path: string | null | undefined, u: FileUsage) => {
    if (!path) return;
    const k = `${bucket}/${path}`;
    usage.set(k, [...(usage.get(k) ?? []), u]);
  };

  const [posts, songs, albums, profiles] = await Promise.all([
    fetchAll<{ title: string; slug: string; content: string; file_path: string | null; cover_image: string | null }>("posts", "title, slug, content, file_path, cover_image"),
    fetchAll<{ id: string; title: string; audio_path: string; cover_path: string | null }>("songs", "id, title, audio_path, cover_path"),
    fetchAll<{ id: string; title: string; is_solo: boolean; cover_path: string | null }>("albums", "id, title, is_solo, cover_path"),
    fetchAll<{ id: string; full_name: string | null; avatar_url: string | null }>("profiles", "id, full_name, avatar_url"),
  ]);
  const settings = await supabase.from("site_settings").select("key, value");
  if (settings.error) throw new Error(`Không đọc được cài đặt trang: ${settings.error.message}`);

  for (const p of posts) {
    const href = `/bai-viet/${encodeURIComponent(p.slug)}`;
    add("books", p.file_path, { label: `Tệp đính kèm: “${p.title}”`, href });
    imagePathsInHtml(p.content).forEach((x) => add("images", x, { label: `Ảnh trong bài: “${p.title}”`, href }));
    const c = imagePathFromUrl(p.cover_image);
    if (c && !imagePathsInHtml(p.content).includes(c)) add("images", c, { label: `Ảnh bìa: “${p.title}”`, href });
  }
  for (const s of songs) {
    add("music", s.audio_path, { label: `Bài hát: “${s.title}”`, href: `/bai-hat/${s.id}` });
    add("covers", s.cover_path, { label: `Bìa bài hát: “${s.title}”`, href: `/bai-hat/${s.id}` });
  }
  for (const a of albums) {
    if (!a.is_solo) add("covers", a.cover_path, { label: `Bìa album: “${a.title}”`, href: `/album/${a.id}` });
  }
  const owners = new Map<string, string>();
  for (const pr of profiles) {
    owners.set(pr.id, pr.full_name || "(chưa đặt tên)");
    add("images", imagePathFromUrl(pr.avatar_url), { label: `Ảnh đại diện: ${pr.full_name ?? ""}`, href: `/tac-gia/${pr.id}` });
  }
  for (const row of (settings.data ?? []) as { key: string; value: unknown }[]) {
    if (typeof row.value === "string") add("images", imagePathFromUrl(row.value), { label: `Cài đặt trang (${row.key})`, href: "/" });
  }
  return { usage, owners };
}

async function listBucket(bucket: Bucket, t: string) {
  const res = await fetch(`/api/media/list?bucket=${bucket}`, { headers: { Authorization: `Bearer ${t}` } });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Không liệt kê được kho ${bucket}.`);
  return json.files as { path: string; size: number; lastModified: string | null }[];
}

/** Toàn bộ tệp trên Cloudflare R2, kèm chủ sở hữu và nơi đang dùng */
export async function loadAllFiles(): Promise<ManagedFile[]> {
  const t = await token();
  const [{ usage, owners }, ...lists] = await Promise.all([buildIndex(), ...BUCKETS.map((b) => listBucket(b, t))]);
  const out: ManagedFile[] = [];
  BUCKETS.forEach((bucket, i) => {
    for (const f of lists[i]) {
      const key = `${bucket}/${f.path}`;
      const ownerId = f.path.split("/")[0];
      out.push({
        key, bucket, path: f.path, name: displayName(f.path), size: f.size, lastModified: f.lastModified,
        ownerId, ownerName: owners.get(ownerId) ?? "(tài khoản đã xoá)", usages: usage.get(key) ?? [],
      });
    }
  });
  return out;
}

export async function deleteFiles(keys: string[]): Promise<number> {
  const t = await token();
  let deleted = 0;
  for (let i = 0; i < keys.length; i += 200) {
    const res = await fetch("/api/media/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ keys: keys.slice(i, i + 200) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Không xoá được tệp.");
    deleted += json.deleted ?? 0;
  }
  return deleted;
}
