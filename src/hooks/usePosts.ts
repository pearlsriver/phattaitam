"use client";

import { listPublishedPosts } from "@/services/postService";
import type { Category, Post } from "@/types/post";
import { useAsync } from "@/hooks/useAsync";

export function usePosts(category?: Category, limit = 100) {
  const { data, loading, error, reload } = useAsync<Post[]>(() => listPublishedPosts(category, limit), [category, limit], []);
  return { posts: data, loading, error, reload };
}
