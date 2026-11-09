"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { deletePost, listAllPosts, setPostPublished } from "@/services/postService";
import { deleteSong, listAllSongs, setSongPublished } from "@/services/songService";
import { CATEGORIES, type Post } from "@/types/post";
import type { Song } from "@/types/song";
import { formatCount, formatDateTime, wasEdited } from "@/utils/formatDate";

function Times({ created, updated, verb }: { created: string; updated: string; verb: string }) {
  return (
    <>
      {verb}: {formatDateTime(created)}
      {wasEdited(created, updated) && <> · Sửa: {formatDateTime(updated)}</>}
    </>
  );
}

function Admin() {
  const [tab, setTab] = useState<"posts" | "songs">("posts");
  const [onlyPending, setOnlyPending] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([listAllPosts(), listAllSongs()]);
    setPosts(p);
    setSongs(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendingPosts = posts.filter((p) => !p.is_published).length;
  const pendingSongs = songs.filter((s) => !s.is_published).length;
  const shownPosts = onlyPending ? posts.filter((p) => !p.is_published) : posts;
  const shownSongs = onlyPending ? songs.filter((s) => !s.is_published) : songs;
  const tabCls = (on: boolean) => `rounded-full px-4 py-2 text-sm ${on ? "bg-ink text-paper" : "border border-line text-ink-soft hover:bg-soft"}`;
  const btn = "rounded-full px-3 py-1.5 text-sm";

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Quản trị</p>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-4xl font-semibold text-ink">Quản trị nội dung</h1>
        <Link href="/admin/don-dep" className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft">🧹 Dọn dẹp kho lưu trữ</Link>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTab("posts")} className={tabCls(tab === "posts")}>Bài viết ({pendingPosts} chờ duyệt)</button>
        <button type="button" onClick={() => setTab("songs")} className={tabCls(tab === "songs")}>Nhạc ({pendingSongs} chờ duyệt)</button>
        <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} /> Chỉ hiện mục chờ duyệt
        </label>
      </div>

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {tab === "posts" &&
          shownPosts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/bai-viet/${p.slug}`} className="font-medium text-ink hover:underline">{p.title}</Link>
                <p className="text-xs text-muted">
                  {CATEGORIES[p.category]?.label} · {p.author?.full_name ?? "?"} · 👁 {formatCount(p.view_count)}{p.file_name && ` · 📎 ${p.file_name}`}
                </p>
                <p className="text-xs text-muted"><Times created={p.created_at} updated={p.updated_at} verb="Đăng" /></p>
              </div>
              <button type="button" onClick={async () => { await setPostPublished(p.id, !p.is_published); load(); }}
                className={`${btn} ${p.is_published ? "bg-soft text-ink" : "bg-green-700 text-white"}`}>{p.is_published ? "Ẩn" : "Duyệt"}</button>
              <Link href={`/sua-bai/${p.id}`} className={`${btn} border border-line text-ink hover:bg-soft`}>✏️ Sửa</Link>
              <button type="button" onClick={async () => { if (confirm("Xoá vĩnh viễn bài này, kèm tệp đính kèm và ảnh trong bài?")) { await deletePost(p); load(); } }}
                className={`${btn} text-red-600 hover:bg-soft`}>Xoá</button>
            </div>
          ))}

        {tab === "songs" &&
          shownSongs.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/bai-hat/${s.id}`} className="font-medium text-ink hover:underline">{s.title}</Link>
                <p className="text-xs text-muted">{s.artist}{s.album_info && ` · ${s.album_info.title}`} · ▶ {formatCount(s.play_count)}</p>
                <p className="text-xs text-muted"><Times created={s.created_at} updated={s.updated_at} verb="Tải lên" /></p>
              </div>
              <button type="button" onClick={async () => { await setSongPublished(s.id, !s.is_published); load(); }}
                className={`${btn} ${s.is_published ? "bg-soft text-ink" : "bg-green-700 text-white"}`}>{s.is_published ? "Ẩn" : "Duyệt"}</button>
              <Link href={`/sua-nhac/${s.id}`} className={`${btn} border border-line text-ink hover:bg-soft`}>✏️ Sửa</Link>
              <button type="button" onClick={async () => { if (confirm("Xoá vĩnh viễn bài hát, kèm tệp nhạc và ảnh bìa?")) { await deleteSong(s); load(); } }}
                className={`${btn} text-red-600 hover:bg-soft`}>Xoá</button>
            </div>
          ))}

        {((tab === "posts" && !shownPosts.length) || (tab === "songs" && !shownSongs.length)) && (
          <p className="p-4 text-sm text-muted">Không có mục nào.</p>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <RequireAuth admin><Admin /></RequireAuth>;
}
