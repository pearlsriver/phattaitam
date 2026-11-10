import { publicUrl, supabase } from "@/lib/supabase";
import type { Album, AlbumInput } from "@/types/album";
import { removeFiles, uploadFile } from "@/services/storage";

/** solo_songs: các bài hát của album — dùng để đếm số bài và lấy ảnh bìa cho album solo (Single) */
const SELECT = "*, owner:profiles(full_name), solo_songs:songs(cover_path, is_published)";

export interface ListOptions {
  /** true: gồm cả Single (album solo). Mặc định false: chỉ album thật. */
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

/** Xoá album — các bài hát trong album vẫn giữ lại (tự thành Single) */
export async function deleteAlbum(album: Album) {
  const { error } = await supabase.from("albums").delete().eq("id", album.id);
  if (error) throw error;
  await removeFiles("covers", [album.cover_path]);
}

/**
 * Đường dẫn ảnh bìa (kho "covers") của album.
 * Album solo (Single) không có ảnh riêng: dùng ảnh bìa của chính bài hát.
 */
export function albumCoverPath(a: Pick<Album, "cover_path" | "is_solo" | "solo_songs">): string | null {
  if (a.cover_path) return a.cover_path;
  if (a.is_solo) return a.solo_songs?.find((s) => s.cover_path)?.cover_path ?? null;
  return null;
}

/** Số bài hát đã đăng của album (người xem thường chỉ thấy bài đã đăng; chủ album/admin có thể thấy cả bài chờ duyệt nên lọc lại) */
export function albumSongCount(a: Pick<Album, "solo_songs">): number {
  return (a.solo_songs ?? []).filter((s) => s.is_published !== false).length;
}

export function albumCoverUrl(a: Pick<Album, "cover_path" | "is_solo" | "solo_songs">): string | null {
  const path = albumCoverPath(a);
  return path ? publicUrl("covers", path) : null;
}
