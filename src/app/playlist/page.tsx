"use client";

import Link from "next/link";
import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/hooks/useAuth";
import { createPlaylist, deletePlaylist, listMyPlaylists } from "@/services/playlistService";
import type { Playlist } from "@/types/social";
import { formatDate } from "@/utils/formatDate";

function MyPlaylists() {
  const { user } = useAuth();
  const { data: lists, reload } = useAsync<Playlist[]>(() => listMyPlaylists(user!.id), [user?.id], []);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !user) return;
    await createPlaylist(title, user.id, isPublic);
    setTitle("");
    reload();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Âm nhạc</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-ink">Playlist của tôi</h1>
      <p className="mt-2 text-ink-soft">Bấm nút ＋ trên mỗi bài hát để thêm vào playlist.</p>

      <form onSubmit={create} className="mt-6 flex flex-wrap items-center gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên playlist mới" className="field !w-auto flex-1" />
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Công khai
        </label>
        <button className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper">＋ Tạo</button>
      </form>

      <div className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {lists.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-xl">♫</span>
            <div className="min-w-0 flex-1">
              <Link href={`/playlist/${p.id}`} className="font-medium text-ink hover:underline">{p.title}</Link>
              <p className="text-xs text-muted">{p.is_public ? "Công khai" : "Riêng tư"} · tạo {formatDate(p.created_at)}</p>
            </div>
            <button type="button" className="text-sm text-red-600 hover:underline"
              onClick={async () => { if (confirm("Xoá playlist này?")) { await deletePlaylist(p.id); reload(); } }}>Xoá</button>
          </div>
        ))}
        {!lists.length && <p className="p-4 text-sm text-muted">Chưa có playlist nào.</p>}
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  return <RequireAuth><MyPlaylists /></RequireAuth>;
}
