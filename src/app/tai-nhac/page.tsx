"use client";

import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import SongForm from "@/components/music/SongForm";
import { useAuth } from "@/hooks/useAuth";
import { uploadSong } from "@/services/songService";

function Upload() {
  const router = useRouter();
  const { user, canPublish } = useAuth();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Âm nhạc</p>
      <h1 className="font-serif text-4xl font-semibold text-ink">Tải nhạc lên</h1>
      {!canPublish && (
        <p className="rounded-xl bg-accent-soft p-3 text-sm text-ink-soft">Bài hát sẽ được quản trị viên duyệt trước khi xuất hiện trong thư viện và radio.</p>
      )}
      <SongForm
        submitLabel="Tải lên"
        onSubmit={async (input) => {
          const s = await uploadSong(input, user!.id, canPublish);
          router.push(canPublish ? `/bai-hat/${s.id}` : "/dashboard?sent=1");
        }}
      />
    </div>
  );
}

export default function UploadMusicPage() {
  return <RequireAuth><Upload /></RequireAuth>;
}
