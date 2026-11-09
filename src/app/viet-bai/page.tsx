"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import PostForm from "@/components/posts/PostForm";
import { useAuth } from "@/hooks/useAuth";
import { createPost } from "@/services/postService";
import { CATEGORY_KEYS, type Category } from "@/types/post";

function Write() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [cat, setCat] = useState<Category | null>(null);

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("category");
    setCat(c && (CATEGORY_KEYS as string[]).includes(c) ? (c as Category) : "van");
  }, []);

  if (!cat) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Sáng tác</p>
      <h1 className="font-serif text-4xl font-semibold text-ink">Viết bài / Tải sách lên</h1>
      {!isAdmin && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-ink-soft">Bài của bạn sẽ được quản trị viên duyệt trước khi hiển thị công khai.</p>
      )}
      <PostForm
        defaultCategory={cat}
        submitLabel={isAdmin ? "Đăng bài" : "Gửi bài"}
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          const post = await createPost(input, user!.id, isAdmin);
          router.push(isAdmin ? `/bai-viet/${post.slug}` : "/dashboard?sent=1");
        }}
      />
    </div>
  );
}

export default function WritePage() {
  return <RequireAuth><Write /></RequireAuth>;
}
