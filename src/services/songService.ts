import { publicUrl, supabase } from "@/lib/supabase";
import type { Song, SongInput } from "@/types/song";
import { removeFiles, uploadFile } from "@/services/storage";

const SELECT = "*, album_info:albums(id, title, cover_path, is_solo)";

/**
 * Bài hát Single (album solo): album trùng tên bài hát nên hiển thị nhãn "Single"
 * thay vì lặp lại tên bài ("Tên bài · Tên bài").
 */
export function singleLabel<T extends Song>(s: T): T {
  return s.album_info?.is_solo ? { ...s, album_info: { ...s.album_info, title: "Single" } } : s;
}

function base() {
  return supabase.from("songs").select(SELECT);
}

function done(res: { data: unknown; error: unknown }): Song[] {
  if (res.error) throw res.error;
  return ((res.data ?? []) as Song[]).map(singleLabel);
}

export async function listPublishedSongs(): Promise<Song[]> {
  return done(await base().eq("is_published", true).order("created_at", { ascending: false }));
}

export async function listSongsByUploader(userId: string): Promise<Song[]> {
  return done(await base().eq("uploader_id", userId).eq("is_published", true).order("created_at", { ascending: false }));
}

export async function listMySongs(userId: string): Promise<Song[]> {
  return done(await base().eq("uploader_id", userId).order("updated_at", { ascending: false }));
}

export async function listAllSongs(): Promise<Song[]> {
  return done(await base().order("updated_at", { ascending: false }));
}

/** Bài trong album, theo số thứ tự rồi ngày tải lên */
export async function listAlbumSongs(albumId: string): Promise<Song[]> {
  return done(
    await base()
      .eq("album_id", albumId)
      .eq("is_published", true)
      .order("track_no", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  );
}

export async function getSongById(id: string): Promise<Song | null> {
  const { data, error } = await base().eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? singleLabel(data as Song) : null;
}

/** Không chọn album (albumId = null): máy chủ tự tạo album solo (Single) cho bài hát. */
export async function uploadSong(input: SongInput, userId: string, publish: boolean): Promise<Song> {
  if (!input.newAudio) throw new Error("Hãy chọn tệp nhạc.");
  const audio_path = await uploadFile("music", input.newAudio, userId);
  let cover_path: string | null = null;
  try {
    if (input.newCover) cover_path = await uploadFile("covers", input.newCover, userId);
  } catch (e) {
    await removeFiles("music", [audio_path]);
    throw e;
  }

  const { data, error } = await supabase.from("songs").insert({
    uploader_id: userId,
    title: input.title.trim(),
    artist: input.artist.trim() || null,
    album_id: input.albumId,
    track_no: input.trackNo,
    lyrics: input.lyrics.trim() || null,
    audio_path,
    cover_path,
    is_published: publish,
  }).select().single();

  if (error) {
    await removeFiles("music", [audio_path]);
    await removeFiles("covers", [cover_path]);
    throw error;
  }
  return data as Song;
}

/** Sửa bài hát. Admin giữ trạng thái đăng; người dùng thường quay về "Chờ duyệt". */
export async function updateSong(song: Song, input: SongInput, userId: string, isAdmin: boolean): Promise<Song> {
  let audio_path = song.audio_path;
  let cover_path = song.cover_path;
  let newAudioPath: string | null = null;
  let newCoverPath: string | null = null;
  const oldAudio: string[] = [];
  const oldCover: string[] = [];

  try {
    if (input.newAudio) {
      newAudioPath = await uploadFile("music", input.newAudio, userId);
      audio_path = newAudioPath;
      oldAudio.push(song.audio_path);
    }
    if (input.newCover) {
      newCoverPath = await uploadFile("covers", input.newCover, userId);
      cover_path = newCoverPath;
      if (song.cover_path) oldCover.push(song.cover_path);
    } else if (input.removeCover && song.cover_path) {
      cover_path = null;
      oldCover.push(song.cover_path);
    }
  } catch (e) {
    await removeFiles("music", [newAudioPath]);
    throw e;
  }

  // Đang là Single mà không chọn album → giữ nguyên album solo hiện tại (giữ nguyên đường dẫn, lượt thích, bình luận)
  const album_id = input.albumId ?? (song.album_info?.is_solo ? song.album_id : null);

  const { data, error } = await supabase.from("songs").update({
    title: input.title.trim(),
    artist: input.artist.trim() || null,
    album_id,
    track_no: input.trackNo,
    lyrics: input.lyrics.trim() || null,
    audio_path,
    cover_path,
    is_published: isAdmin ? song.is_published : false,
  }).eq("id", song.id).select().single();

  if (error) {
    await removeFiles("music", [newAudioPath]);
    await removeFiles("covers", [newCoverPath]);
    throw error;
  }
  await removeFiles("music", oldAudio);
  await removeFiles("covers", oldCover);
  return data as Song;
}

export async function setSongPublished(id: string, value: boolean) {
  const { error } = await supabase.from("songs").update({ is_published: value }).eq("id", id);
  if (error) throw error;
}

/** Xoá bài hát + tệp nhạc + ảnh bìa (album solo của bài cũng tự xoá theo) */
export async function deleteSong(song: Song) {
  const { error } = await supabase.from("songs").delete().eq("id", song.id);
  if (error) throw error;
  await removeFiles("music", [song.audio_path]);
  await removeFiles("covers", [song.cover_path]);
}

export const songAudioUrl = (s: Song) => publicUrl("music", s.audio_path);
export const songDownloadUrl = (s: Song) => publicUrl("music", s.audio_path, true);
/** Đường dẫn ảnh bìa của bài hát: ảnh riêng → bìa album */
export const songCoverPath = (s: Song): string | null => s.cover_path ?? s.album_info?.cover_path ?? null;
/** Ảnh bìa bài hát; nếu không có thì dùng bìa album */
export const songCoverUrl = (s: Song) => {
  const p = songCoverPath(s);
  return p ? publicUrl("covers", p) : null;
};
