"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { deletePost, listAllPosts, setPostPublished } from "@/services/postService";
import { deleteSong, listAllSongs, setSongDuration, setSongPublished, songAudioUrl } from "@/services/songService";
import type { Post } from "@/types/post";
import { authorLabel } from "@/types/post";
import type { Song } from "@/types/song";
import { readAudioDuration } from "@/utils/audioDuration";
import { formatCount, formatDateTime, formatDuration, wasEdited } from "@/utils/formatDate";

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
  const [measure, setMeasure] = useState<string | null>(null);

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
  const noDuration = songs.filter((s) => !s.duration_seconds);
  const tabCls = (on: boolean) => `btn ${on ? "btn-primary" : "btn-secondary"}`;
  const small = "!py-1.5";

  /** Đo thời lượng các bài hát cũ chưa có */
  async function measureAll() {
    let ok = 0;
    for (let i = 0; i < noDuration.length; i++) {
      const s = noDuration[i];
      setMeasure(`Đang đo ${i + 1}/${noDuration.length}: ${s.title}`);
      const d = await readAudioDuration(songAudioUrl(s));
      if (d) {
        try { await setSongDuration(s.id, d); ok++; } catch {}
      }
    }
    setMeasure(`Đã đo xong ${ok}/${noDuration.length} bài.`);
    load();
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Quản trị</p>
      <div className="mb-6 mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Quản trị nội dung</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/thanh-vien" className="btn btn-secondary">👥 Thành viên</Link>
          <Link href="/admin/radio" className="btn btn-secondary">📻 Quản lý Radio</Link>
          <Link href="/admin/don-dep" className="btn btn-secondary">🧹 Dọn dẹp kho lưu trữ</Link>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTab("posts")} className={tabCls(tab === "posts")}>Bài viết ({pendingPosts} chờ duyệt)</button>
        <button type="button" onClick={() => setTab("songs")} className={tabCls(tab === "songs")}>Nhạc ({pendingSongs} chờ duyệt)</button>
        <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} className="accent-[var(--accent)]" /> Chỉ hiện mục chờ duyệt
        </label>
      </div>

      {tab === "songs" && (noDuration.length > 0 || measure) && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-sm">
          {noDuration.length > 0 && (
            <button type="button" className="btn btn-secondary !py-1.5" disabled={!!measure && measure.startsWith("Đang")} onClick={measureAll}>
              ⏱ Đo thời lượng ({noDuration.length} bài chưa có)
            </button>
          )}
          {measure && <span className="text-muted">{measure}</span>}
        </div>
      )}

      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {tab === "posts" &&
          shownPosts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/bai-viet/${p.slug}`} className="font-medium text-ink hover:underline">{p.title}</Link>
                <p className="text-xs text-muted">
                  Tác giả: {authorLabel(p)} · đăng bởi {p.author?.full_name ?? "?"} · 👁 {formatCount(p.view_count)}{p.file_name && ` · 📎 ${p.file_name}`}
                </p>
                {p.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
                <p className="text-xs text-muted"><Times created={p.created_at} updated={p.updated_at} verb="Đăng" /></p>
              </div>
              <button type="button" onClick={async () => { await setPostPublished(p.id, !p.is_published); load(); }}
                className={`btn ${small} ${p.is_published ? "btn-secondary" : "btn-primary"}`}>{p.is_published ? "Ẩn" : "Duyệt"}</button>
              <Link href={`/sua-bai/${p.id}`} className={`btn btn-secondary ${small}`}>✏️ Sửa</Link>
              <button type="button" onClick={async () => { if (confirm("Xoá vĩnh viễn bài này, kèm tệp đính kèm và ảnh trong bài?")) { await deletePost(p); load(); } }}
                className={`btn btn-danger ${small}`}>Xoá</button>
            </div>
          ))}

        {tab === "songs" &&
          shownSongs.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/bai-hat/${s.id}`} className="font-medium text-ink hover:underline">{s.title}</Link>
                <p className="text-xs text-muted">
                  {s.artist}{s.album_info && ` · ${s.album_info.title}`} · {formatDuration(s.duration_seconds) || "chưa có thời lượng"} · ▶ {formatCount(s.play_count)}
                </p>
                <p className="text-xs text-muted"><Times created={s.created_at} updated={s.updated_at} verb="Tải lên" /></p>
              </div>
              <button type="button" onClick={async () => { await setSongPublished(s.id, !s.is_published); load(); }}
                className={`btn ${small} ${s.is_published ? "btn-secondary" : "btn-primary"}`}>{s.is_published ? "Ẩn" : "Duyệt"}</button>
              <Link href={`/sua-nhac/${s.id}`} className={`btn btn-secondary ${small}`}>✏️ Sửa</Link>
              <button type="button" onClick={async () => { if (confirm("Xoá vĩnh viễn bài hát, kèm tệp nhạc và ảnh bìa?")) { await deleteSong(s); load(); } }}
                className={`btn btn-danger ${small}`}>Xoá</button>
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
