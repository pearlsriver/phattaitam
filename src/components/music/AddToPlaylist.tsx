"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { addSongToPlaylist, createPlaylist, listMyPlaylists } from "@/services/playlistService";
import type { Playlist } from "@/types/social";

/** Nút "+" thêm bài hát vào playlist của tôi */
export default function AddToPlaylist({ songId }: { songId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<Playlist[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function toggle() {
    if (!user) return router.push("/login");
    if (!open) setLists(await listMyPlaylists(user.id));
    setMsg(null);
    setOpen(!open);
  }

  async function add(p: Playlist) {
    await addSongToPlaylist(p.id, songId);
    setMsg(`Đã thêm vào “${p.title}”`);
    setTimeout(() => setOpen(false), 900);
  }

  async function createAndAdd() {
    if (!user) return;
    const title = prompt("Tên playlist mới:");
    if (!title?.trim()) return;
    const p = await createPlaylist(title, user.id);
    await add(p);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        title="Thêm vào playlist"
        aria-label="Thêm vào playlist"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-soft hover:bg-soft"
      >
        ＋
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-line bg-surface p-2 shadow-xl">
          {msg ? (
            <p className="p-2 text-sm text-green-700">{msg}</p>
          ) : (
            <>
              <p className="px-2 pb-1 text-xs uppercase tracking-wider text-muted">Thêm vào playlist</p>
              {lists.map((p) => (
                <button key={p.id} type="button" onClick={() => add(p)} className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-ink hover:bg-soft">
                  {p.title}
                </button>
              ))}
              <button type="button" onClick={createAndAdd} className="mt-1 block w-full rounded-lg px-2 py-1.5 text-left text-sm text-accent hover:bg-soft">
                ＋ Tạo playlist mới
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
