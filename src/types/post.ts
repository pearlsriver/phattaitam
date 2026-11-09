export type Category = "van" | "tho" | "kinh-phat" | "thien";

export const CATEGORIES: Record<Category, { label: string; description: string }> = {
  van: { label: "Văn", description: "Tản văn, bài viết, chiêm nghiệm đời sống." },
  tho: { label: "Thơ", description: "Những vần thơ an nhiên, tĩnh lặng." },
  "kinh-phat": { label: "Kinh Phật", description: "Kinh điển, sách và tài liệu Phật học." },
  thien: { label: "Thiền", description: "Hướng dẫn và cảm nhận thực hành thiền." },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  category: Category;
  excerpt: string | null;
  /** HTML (bài mới) hoặc văn bản thuần (bài cũ) */
  content: string;
  file_path: string | null;
  file_name: string | null;
  cover_image: string | null;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface PostInput {
  title: string;
  category: Category;
  excerpt: string;
  content: string;
  /** Tệp mới (khi tạo hoặc thay thế) */
  newFile?: File | null;
  /** Xoá tệp đính kèm hiện tại (khi sửa) */
  removeFile?: boolean;
}
