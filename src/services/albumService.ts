import { publicUrl, supabase } from "@/lib/supabase";
import type { Album, AlbumInput } from "@/types/album";
import { removeFiles, uploadFile } from "@/services/storage";

const SELECT = "*, owner:profiles(full_name)";

export async function listAlbums(): Promise<Album[]> {
  const { data, error } = await supabase.from("albums").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Album[];
}

export async function listAlbumsByOwner(ownerId: string): Promise<Album[]> {
  const { data, error } = await supabase.from("albums").select(SELECT).eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
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

/** Xoá album — các bài hát trong album vẫn giữ lại (không còn thuộc album nào) */
export async function deleteAlbum(album: Album) {
  const { error } = await supabase.from("albums").delete().eq("id", album.id);
  if (error) throw error;
  await removeFiles("covers", [album.cover_path]);
}

export const albumCoverUrl = (a: Pick<Album, "cover_path">) => (a.cover_path ? publicUrl("covers", a.cover_path) : null);
