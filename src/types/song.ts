export interface Song {
  id: string;
  uploader_id: string;
  title: string;
  artist: string | null;
  album_id: string | null;
  lyrics: string | null;
  track_no: number | null;
  play_count: number;
  /** Thời lượng (giây) — null nếu chưa đo */
  duration_seconds: number | null;
  audio_path: string;
  cover_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  /** Với bài Đĩa đơn (album solo), title được hiển thị là "Đĩa đơn" */
  album_info?: { id: string; title: string; cover_path: string | null; is_solo?: boolean } | null;
}

export interface SongInput {
  title: string;
  artist: string;
  /** null = không chọn album → bài hát là một Đĩa đơn (album solo) */
  albumId: string | null;
  trackNo: number | null;
  lyrics: string;
  /** Tệp nhạc (bắt buộc khi tạo, tuỳ chọn khi sửa) */
  newAudio?: File | null;
  /** Thời lượng của tệp nhạc mới (giây), đo khi chọn tệp */
  durationSec?: number | null;
  newCover?: File | null;
  removeCover?: boolean;
}
