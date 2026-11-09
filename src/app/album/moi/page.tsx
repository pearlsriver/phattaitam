"use client";

import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import AlbumForm from "@/components/music/AlbumForm";
import { useAuth } from "@/hooks/useAuth";
import { createAlbum } from "@/services/albumService";

function NewAlbum() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-serif text-4xl font-semibold text-ink">Tạo album mới</h1>
      <AlbumForm
        submitLabel="Tạo album"
        onCancel={() => router.back()}
        onSubmit={async (input) => {
          const a = await createAlbum(input, user!.id);
          router.push(`/album/${a.id}`);
        }}
      />
    </div>
  );
}

export default function NewAlbumPage() {
  return <RequireAuth><NewAlbum /></RequireAuth>;
}
