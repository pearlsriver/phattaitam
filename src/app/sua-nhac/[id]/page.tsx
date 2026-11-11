"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import SongForm from "@/components/music/SongForm";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { getSongById, updateSong } from "@/services/songService";
import { formatDateTime, wasEdited } from "@/utils/formatDate";

function Edit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin, canPublish } = useAuth();
  const { data: song, loading } = useAsync(() => getSongById(id), [id], null);

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!song) return <p className="py-16 text-center text-ink-soft">Không tìm thấy bài hát.</p>;
  if (!user || (user.id !== song.uploader_id && !isAdmin)) return <p className="py-16 text-center text-ink-soft">Bạn không có quyền sửa bài hát này.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/dashboard" className="text-sm text-accent hover:underline">← Tài khoản</Link>
      <h1 className="font-serif text-4xl font-semibold text-ink">Sửa bài hát</h1>
      <p className="text-sm text-muted">
        Tải lên lúc {formatDateTime(song.created_at)}
        {wasEdited(song.created_at, song.updated_at) && ` · Sửa lần cuối ${formatDateTime(song.updated_at)}`}
      </p>
      {!canPublish && song.is_published && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-ink-soft">Sau khi lưu, bài hát sẽ chuyển về trạng thái <b>Chờ duyệt</b>.</p>
      )}
      <SongForm
        song={song}
        submitLabel="Lưu thay đổi"
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          await updateSong(song, input, user.id, canPublish);
          router.push(canPublish ? `/bai-hat/${song.id}` : "/dashboard?sent=1");
        }}
      />
    </div>
  );
}

export default function EditSongPage() {
  return <RequireAuth><Edit /></RequireAuth>;
}
