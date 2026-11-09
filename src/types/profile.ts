export type Role = "user" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: Role;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
}
