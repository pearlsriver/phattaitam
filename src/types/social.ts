export type TargetType = "post" | "song" | "album";

export interface Comment {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  body: string;
  created_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface Playlist {
  id: string;
  owner_id: string;
  title: string;
  is_public: boolean;
  created_at: string;
  owner?: { full_name: string | null } | null;
}
