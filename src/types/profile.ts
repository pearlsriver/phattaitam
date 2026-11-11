/** user = Thành viên mới · vip = VIP · admin = Admin · super_admin = Super Admin */
export type Role = "user" | "vip" | "admin" | "super_admin";

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
