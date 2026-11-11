export interface Album {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
  /** true = Đĩa đơn: album solo tự tạo cho bài hát không thuộc album nào */
  is_solo: boolean;
  /** Các bài hát của album (vài cột): đếm số bài, lấy ảnh bìa và id bài hát cho Đĩa đơn */
  solo_songs?: { id: string; cover_path: string | null; is_published?: boolean }[] | null;
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
