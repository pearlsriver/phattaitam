"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import PostForm from "@/components/posts/PostForm";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getPostById, updatePost } from "@/services/postService";
import { formatDateTime, wasEdited } from "@/utils/formatDate";

function Edit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { data: post, loading } = useAsync(() => getPostById(id), [id], null);

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!post) return <p className="py-16 text-center text-ink-soft">Không tìm thấy bài viết.</p>;
  if (!user || (user.id !== post.author_id && !isAdmin)) return <p className="py-16 text-center text-ink-soft">Bạn không có quyền sửa bài này.</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/dashboard" className="text-sm text-accent hover:underline">← Tài khoản</Link>
      <h1 className="font-serif text-4xl font-semibold text-ink">Sửa bài viết</h1>
      <p className="text-sm text-muted">
        Đăng lúc {formatDateTime(post.created_at)}
        {wasEdited(post.created_at, post.updated_at) && ` · Sửa lần cuối ${formatDateTime(post.updated_at)}`}
      </p>
      {!isAdmin && post.is_published && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-ink-soft">Sau khi lưu, bài sẽ chuyển về trạng thái <b>Chờ duyệt</b>.</p>
      )}
      <PostForm
        post={post}
        submitLabel="Lưu thay đổi"
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          const saved = await updatePost(post, input, user.id, isAdmin);
          router.push(isAdmin ? `/bai-viet/${saved.slug}` : "/dashboard?sent=1");
        }}
      />
    </div>
  );
}

export default function EditPostPage() {
  return <RequireAuth><Edit /></RequireAuth>;
}
