import type { Role } from "@/types/profile";

export const ROLE_ORDER: Role[] = ["user", "vip", "admin", "super_admin"];

export const ROLE_LABELS: Record<Role, string> = {
  user: "Thành viên mới",
  vip: "VIP",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  user: "Bài viết và nhạc phải chờ Admin duyệt. Sửa bài đã đăng thì quay về chờ duyệt.",
  vip: "Đăng và sửa đều hiện ngay, không cần duyệt. Chỉ sửa và xoá nội dung của chính mình.",
  admin: "Toàn quyền nội dung, quản lý thành viên (Mới / VIP), Radio, kho lưu trữ.",
  super_admin: "Mọi quyền của Admin, cấp/thu hồi quyền Admin, Chế độ chỉnh sửa trang.",
};

export const isAdminRole = (r?: string | null) => r === "admin" || r === "super_admin";
export const canPublishRole = (r?: string | null) => r === "vip" || isAdminRole(r);
