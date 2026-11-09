export type Role = "user" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: Role;
  created_at: string;
}
