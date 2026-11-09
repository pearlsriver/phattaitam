export interface Album {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  cover_path: string | null;
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
