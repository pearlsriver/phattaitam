export interface Song {
  id: string;
  uploader_id: string;
  title: string;
  artist: string | null;
  album_id: string | null;
  lyrics: string | null;
  track_no: number | null;
  play_count: number;
  audio_path: string;
  cover_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  album_info?: { id: string; title: string; cover_path: string | null } | null;
}

export interface SongInput {
  title: string;
  artist: string;
  albumId: string | null;
  trackNo: number | null;
  lyrics: string;
  /** Tệp nhạc (bắt buộc khi tạo, tuỳ chọn khi sửa) */
  newAudio?: File | null;
  newCover?: File | null;
  removeCover?: boolean;
}
