"use client";

import { listPublishedPosts } from "@/services/postService";
import type { Post } from "@/types/post";
import { useAsync } from "@/hooks/useAsync";

export function usePosts(limit = 200) {
  const { data, loading, error, reload } = useAsync<Post[]>(() => listPublishedPosts(limit), [limit], []);
  return { posts: data, loading, error, reload };
}
