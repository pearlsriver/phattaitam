import { supabase } from "@/lib/supabase";
import type { Post, PostInput } from "@/types/post";
import { firstImage } from "@/utils/html";
import { slugify } from "@/utils/slug";
import { difference, imagePathsInHtml } from "@/utils/storagePaths";
import { uniqueTags } from "@/utils/tags";
import { removeFiles, uploadFile } from "@/services/storage";

const SELECT = "*, author:profiles(full_name, avatar_url)";

export async function listPublishedPosts(limit = 200): Promise<Post[]> {
  const { data, error } = await supabase.from("posts").select(SELECT).eq("is_published", true)
    .order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function listPostsByAuthor(authorId: string, onlyPublished = true): Promise<Post[]> {
  let q = supabase.from("posts").select(SELECT).eq("author_id", authorId).order("created_at", { ascending: false });
  if (onlyPublished) q = q.eq("is_published", true);
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
    cover_image: firstImage(input.content),
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

/** Sửa bài. Admin giữ trạng thái đăng; người dùng thường quay về "Chờ duyệt".
 *  Tệp đính kèm cũ và ảnh bị gỡ khỏi nội dung sẽ được xoá khỏi kho. */
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

  const { data, error } = await supabase.from("posts").update({
    title: input.title.trim(),
    tags: uniqueTags(input.tags),
    author_name: input.authorName.trim() || null,
    excerpt: input.excerpt.trim() || null,
    content: input.content,
    cover_image: firstImage(input.content),
    file_path,
    file_name,
    is_published: isAdmin ? post.is_published : false,
  }).eq("id", post.id).select().single();

  if (error) {
    await removeFiles("books", [uploaded]);
    throw error;
  }
  await removeFiles("books", [oldToDelete]);
  await removeFiles("images", difference(imagePathsInHtml(post.content), imagePathsInHtml(input.content)));
  return data as Post;
}

export async function setPostPublished(id: string, value: boolean) {
  const { error } = await supabase.from("posts").update({ is_published: value }).eq("id", id);
  if (error) throw error;
}

/** Xoá bài + tệp đính kèm + mọi ảnh đã chèn trong bài */
export async function deletePost(post: Post) {
  const { error } = await supabase.from("posts").delete().eq("id", post.id);
  if (error) throw error;
  await removeFiles("books", [post.file_path]);
  await removeFiles("images", imagePathsInHtml(post.content));
}
