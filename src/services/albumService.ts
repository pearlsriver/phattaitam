import { publicUrl, supabase } from "@/lib/supabase";
import type { Album, AlbumInput } from "@/types/album";
import { removeFiles, uploadFile } from "@/services/storage";

/** solo_songs: các bài hát của album — đếm số bài, lấy ảnh bìa và id bài hát cho Đĩa đơn */
const SELECT = "*, owner:profiles(full_name), solo_songs:songs(id, cover_path, is_published)";

export interface ListOptions {
  /** true: gồm cả Đĩa đơn (album solo). Mặc định false: chỉ album thật. */
  includeSolo?: boolean;
}

export async function listAlbums(opts: ListOptions = {}): Promise<Album[]> {
  let q = supabase.from("albums").select(SELECT).order("created_at", { ascending: false });
  if (!opts.includeSolo) q = q.eq("is_solo", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Album[];
}

export async function listAlbumsByOwner(ownerId: string, opts: ListOptions = {}): Promise<Album[]> {
  let q = supabase.from("albums").select(SELECT).eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (!opts.includeSolo) q = q.eq("is_solo", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Album[];
}

export async function getAlbum(id: string): Promise<Album | null> {
  const { data, error } = await supabase.from("albums").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Album | null;
}

export async function createAlbum(input: AlbumInput, userId: string): Promise<Album> {
  const cover_path = input.newCover ? await uploadFile("covers", input.newCover, userId, "album-") : null;
  const { data, error } = await supabase.from("albums").insert({
    owner_id: userId,
    title: input.title.trim(),
    description: input.description.trim() || null,
    cover_path,
  }).select().single();
  if (error) {
    await removeFiles("covers", [cover_path]);
    throw error;
  }
  return data as Album;
}

export async function updateAlbum(album: Album, input: AlbumInput, userId: string): Promise<Album> {
  let cover_path = album.cover_path;
  let uploaded: string | null = null;
  let old: string | null = null;
  if (input.newCover) {
    uploaded = await uploadFile("covers", input.newCover, userId, "album-");
    cover_path = uploaded;
    old = album.cover_path;
  } else if (input.removeCover) {
    cover_path = null;
    old = album.cover_path;
  }
  const { data, error } = await supabase.from("albums").update({
    title: input.title.trim(),
    description: input.description.trim() || null,
    cover_path,
  }).eq("id", album.id).select().single();
  if (error) {
    await removeFiles("covers", [uploaded]);
    throw error;
  }
  await removeFiles("covers", [old]);
  return data as Album;
}

/** Xoá album — các bài hát trong album vẫn giữ lại (tự thành Đĩa đơn) */
export async function deleteAlbum(album: Album) {
  const { error } = await supabase.from("albums").delete().eq("id", album.id);
  if (error) throw error;
  await removeFiles("covers", [album.cover_path]);
}

/** Id bài hát của một Đĩa đơn (null nếu không phải Đĩa đơn) */
export function soloSongId(a: Pick<Album, "is_solo" | "solo_songs">): string | null {
  return a.is_solo ? (a.solo_songs?.[0]?.id ?? null) : null;
}

/** Đường dẫn khi bấm vào album: Đĩa đơn mở thẳng trang bài hát */
export function albumHref(a: Pick<Album, "id" | "is_solo" | "solo_songs">): string {
  const sid = soloSongId(a);
  return sid ? `/bai-hat/${sid}` : `/album/${a.id}`;
}

/** Đường dẫn ảnh bìa (kho "covers"). Đĩa đơn không có ảnh riêng: dùng ảnh bìa bài hát. */
export function albumCoverPath(a: Pick<Album, "cover_path" | "is_solo" | "solo_songs">): string | null {
  if (a.cover_path) return a.cover_path;
  if (a.is_solo) return a.solo_songs?.find((s) => s.cover_path)?.cover_path ?? null;
  return null;
}

/** Số bài hát đã đăng của album */
export function albumSongCount(a: Pick<Album, "solo_songs">): number {
  return (a.solo_songs ?? []).filter((s) => s.is_published !== false).length;
}

export function albumCoverUrl(a: Pick<Album, "cover_path" | "is_solo" | "solo_songs">): string | null {
  const path = albumCoverPath(a);
  return path ? publicUrl("covers", path) : null;
}
