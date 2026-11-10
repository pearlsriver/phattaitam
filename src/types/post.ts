export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  /** Hashtag, viết thường, không dấu cách, ví dụ: "kinh-phật" */
  tags: string[];
  /** Tác giả của tác phẩm (có thể khác người đăng) */
  author_name: string | null;
  excerpt: string | null;
  /** HTML (bài mới) hoặc văn bản thuần (bài cũ) */
  content: string;
  file_path: string | null;
  file_name: string | null;
  /** Ảnh bìa / bìa sách. Nếu người đăng không chọn: tự lấy ảnh đầu tiên trong nội dung. */
  cover_image: string | null;
  view_count: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  /** Người đăng bài */
  author?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface PostInput {
  title: string;
  tags: string[];
  authorName: string;
  excerpt: string;
  content: string;
  /** Ảnh bìa đã tải lên (URL). null = không có ảnh bìa riêng (dùng ảnh đầu tiên trong bài). */
  coverImage: string | null;
  /** Tệp mới (khi tạo hoặc thay thế) */
  newFile?: File | null;
  /** Xoá tệp đính kèm hiện tại (khi sửa) */
  removeFile?: boolean;
}

/** Tên tác giả hiển thị: ưu tiên "Tác giả" nhập tay, nếu không có thì tên người đăng */
export function authorLabel(p: Pick<Post, "author_name" | "author">): string {
  return p.author_name?.trim() || p.author?.full_name || "Ẩn danh";
}

/** Ảnh bìa do người đăng chọn riêng (không phải ảnh tự lấy từ nội dung) */
export function customCover(p: Pick<Post, "cover_image" | "content">): string | null {
  if (!p.cover_image) return null;
  const m = p.content?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const first = m ? m[1].replace(/&amp;/g, "&") : null;
  return p.cover_image === first ? null : p.cover_image;
}
