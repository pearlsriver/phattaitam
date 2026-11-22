import { supabase } from "@/lib/supabase";
import type { Post, PostInput } from "@/types/post";
import { firstImage } from "@/utils/html";
import { ownedPaths } from "@/utils/ownership";
import { slugify } from "@/utils/slug";
import { difference, imagePathFromUrl, imagePathsInHtml } from "@/utils/storagePaths";
import { uniqueTags } from "@/utils/tags";
import { removeFiles, uploadFile } from "@/services/storage";

const SELECT = "*, author:profiles(full_name, avatar_url)";

/** Mọi ảnh (thuộc kho images) mà bài viết đang dùng: ảnh trong nội dung + ảnh bìa */
function imagesOf(content: string | null | undefined, cover: string | null | undefined): string[] {
  const list = imagePathsInHtml(content);
  const c = imagePathFromUrl(cover);
  if (c && !list.includes(c)) list.push(c);
  return list;
}

/** Thư viện, trang chủ: chỉ bài CÔNG KHAI đã duyệt */
export async function listPublishedPosts(limit = 200): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select(SELECT)
    .eq("is_published", true).eq("visibility", "public")
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function listPostsByAuthor(authorId: string, onlyPublished = true): Promise<Post[]> {
  let q = supabase.from("posts").select(SELECT).eq("author_id", authorId).order("created_at", { ascending: false });
  if (onlyPublished) q = q.eq("is_published", true).eq("visibility", "public");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase.from("posts").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data as Post | null;
}

export async function getPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase.from("posts").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Post | null;
}

export async function listMyPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select(SELECT).eq("author_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function listAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select(SELECT).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function createPost(input: PostInput, userId: string, publish: boolean): Promise<Post> {
  let file_path: string | null = null;
  let file_name: string | null = null;
  if (input.newFile) {
    file_path = await uploadFile("books", input.newFile, userId);
    file_name = input.newFile.name;
  }

  const { data, error } = await supabase.from("posts").insert({
    author_id: userId,
    title: input.title.trim(),
    slug: slugify(input.title),
    tags: uniqueTags(input.tags),
    author_name: input.authorName.trim() || null,
    excerpt: input.excerpt.trim() || null,
    content: input.content,
    cover_image: input.coverImage || firstImage(input.content),
    visibility: input.visibility,
    file_path,
    file_name,
    is_published: publish,
  }).select().single();

  if (error) {
    await removeFiles("books", [file_path]);
    throw error;
  }
  return data as Post;
}

/** Sửa bài. Admin/VIP giữ trạng thái đăng; Thành viên mới quay về "Chờ duyệt".
 *  Tệp đính kèm cũ, ảnh bìa cũ và ảnh bị gỡ khỏi nội dung được xoá khỏi kho
 *  (chỉ các tệp thuộc thư mục của tác giả bài). */
export async function updatePost(post: Post, input: PostInput, userId: string, isAdmin: boolean): Promise<Post> {
  let file_path = post.file_path;
  let file_name = post.file_name;
  let uploaded: string | null = null;
  let oldToDelete: string | null = null;

  if (input.newFile) {
    uploaded = await uploadFile("books", input.newFile, userId);
    file_path = uploaded;
    file_name = input.newFile.name;
    oldToDelete = post.file_path;
  } else if (input.removeFile && post.file_path) {
    file_path = null;
    file_name = null;
    oldToDelete = post.file_path;
  }

  const cover_image = input.coverImage || firstImage(input.content);

  const { data, error } = await supabase.from("posts").update({
    title: input.title.trim(),
    tags: uniqueTags(input.tags),
    author_name: input.authorName.trim() || null,
    excerpt: input.excerpt.trim() || null,
    content: input.content,
    cover_image,
    visibility: input.visibility,
    file_path,
    file_name,
    is_published: isAdmin ? post.is_published : false,
  }).eq("id", post.id).select().single();

  if (error) {
    await removeFiles("books", [uploaded]);
    throw error;
  }
  await removeFiles("books", ownedPaths([oldToDelete], post.author_id));
  await removeFiles(
    "images",
    ownedPaths(difference(imagesOf(post.content, post.cover_image), imagesOf(input.content, cover_image)), post.author_id),
  );
  return data as Post;
}

export async function setPostPublished(id: string, value: boolean) {
  const { error } = await supabase.from("posts").update({ is_published: value }).eq("id", id);
  if (error) throw error;
}

/** Xoá bài + tệp đính kèm + ảnh bìa + ảnh đã chèn trong bài (chỉ tệp thuộc thư mục của tác giả) */
export async function deletePost(post: Post) {
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) throw error;
  await removeFiles("books", ownedPaths([post.file_path], post.author_id));
  await removeFiles("images", ownedPaths(imagesOf(post.content, post.cover_image), post.author_id));
}
