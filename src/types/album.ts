export interface Album {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  /** true = "Single": album solo tự tạo cho bài hát không thuộc album nào */
  is_solo: boolean;
  /** Các bài hát của album (chỉ vài cột): đếm số bài, và lấy ảnh bìa bài hát làm bìa cho album solo */
  solo_songs?: { cover_path: string | null; is_published?: boolean }[] | null;
  created_at: string;
  updated_at: string;
  owner?: { full_name: string | null } | null;
}

export interface AlbumInput {
  title: string;
  description: string;
  newCover?: File | null;
  removeCover?: boolean;
}
