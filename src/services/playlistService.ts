import { supabase } from "@/lib/supabase";
import { singleLabel } from "@/services/songService";
import type { Playlist } from "@/types/social";
import type { Song } from "@/types/song";

export async function listMyPlaylists(userId: string): Promise<Playlist[]> {
  const { data, error } = await supabase.from("playlists").select("*").eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Playlist[];
}

export async function getPlaylist(id: string): Promise<Playlist | null> {
  const { data, error } = await supabase.from("playlists").select("*, owner:profiles(full_name)").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Playlist | null;
}

export async function createPlaylist(title: string, userId: string, isPublic = true): Promise<Playlist> {
  const { data, error } = await supabase.from("playlists")
    .insert({ owner_id: userId, title: title.trim(), is_public: isPublic }).select().single();
  if (error) throw error;
  return data as Playlist;
}

export async function updatePlaylist(id: string, fields: { title?: string; is_public?: boolean }) {
  const { error } = await supabase.from("playlists").update(fields).eq("id", id);
  if (error) throw error;
}

export async function deletePlaylist(id: string) {
  const { error } = await supabase.from("playlists").delete().eq("id", id);
  if (error) throw error;
}

export async function listPlaylistSongs(playlistId: string): Promise<Song[]> {
  const { data, error } = await supabase.from("playlist_songs")
    .select("added_at, song:songs(*, album_info:albums(id, title, cover_path, is_solo))")
    .eq("playlist_id", playlistId)
    .order("added_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as { song: Song | null }[])
    .map((r) => r.song)
    .filter((s): s is Song => !!s && s.is_published)
    .map(singleLabel);
}

export async function addSongToPlaylist(playlistId: string, songId: string) {
  const { error } = await supabase.from("playlist_songs").upsert(
    { playlist_id: playlistId, song_id: songId },
    { onConflict: "playlist_id,song_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function removeSongFromPlaylist(playlistId: string, songId: string) {
  const { error } = await supabase.from("playlist_songs").delete().eq("playlist_id", playlistId).eq("song_id", songId);
  if (error) throw error;
}
