"use client";

import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AlbumForm from "@/components/music/AlbumForm";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getAlbum, updateAlbum } from "@/services/albumService";

function EditAlbum() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { data: album, loading } = useAsync(() => getAlbum(id), [id], null);

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!album) return <p className="py-16 text-center text-ink-soft">Không tìm thấy album.</p>;
  if (!user || (user.id !== album.owner_id && !isAdmin)) return <p className="py-16 text-center text-ink-soft">Bạn không có quyền sửa album này.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-serif text-4xl font-semibold text-ink">Sửa album</h1>
      <AlbumForm
        album={album}
        submitLabel="Lưu thay đổi"
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          await updateAlbum(album, input, user.id);
          router.push(`/album/${album.id}`);
        }}
      />
    </div>
  );
}

export default function EditAlbumPage() {
  return <RequireAuth><EditAlbum /></RequireAuth>;
}
