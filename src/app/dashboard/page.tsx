"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Avatar from "@/components/social/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { deleteAlbum, listAlbumsByOwner } from "@/services/albumService";
import { deletePost, listMyPosts } from "@/services/postService";
import { deleteSong, listMySongs } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Post } from "@/types/post";
import type { Song } from "@/types/song";
import { formatCount, formatDateTime, wasEdited } from "@/utils/formatDate";

function Status({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-800">Đã đăng</span>
  ) : (
    <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs text-yellow-800">Chờ duyệt</span>
  );
}

function Times({ created, updated, verb = "Đăng" }: { created: string; updated: string; verb?: string }) {
  return (
    <>
      {verb}: {formatDateTime(created)}
      {wasEdited(created, updated) && <> · Sửa: {formatDateTime(updated)}</>}
    </>
  );
}

function Dashboard() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [p, s, a] = await Promise.all([listMyPosts(user.id), listMySongs(user.id), listAlbumsByOwner(user.id)]);
    setPosts(p);
    setSongs(s);
    setAlbums(a);
  }, [user]);

  useEffect(() => {
    setSent(new URLSearchParams(window.location.search).has("sent"));
    load();
  }, [load]);

  const box = "divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface";
  const views = posts.reduce((n, p) => n + p.view_count, 0);
  const plays = songs.reduce((n, s) => n + s.play_count, 0);

  return (
    <div className="space-y-12">
      <section className="hero-glow rounded-[2rem] border border-line px-8 py-10">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar url={profile?.avatar_url} name={profile?.full_name} size={72} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Tài khoản</p>
            <h1 className="mt-1 font-serif text-4xl font-semibold text-ink">Xin chào, {profile?.full_name ?? user?.email} 🙏</h1>
            <p className="mt-1 text-sm text-muted">👁 {formatCount(views)} lượt đọc · ▶ {formatCount(plays)} lượt nghe</p>
          </div>
        </div>
        {sent && <p className="mt-4 rounded-xl bg-green-100 p-3 text-green-800">Đã lưu! Nội dung đang chờ duyệt.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/viet-bai" className="btn btn-primary">✍️ Viết bài / tải sách</Link>
          <Link href="/tai-nhac" className="btn btn-secondary">⬆ Tải nhạc</Link>
          <Link href="/album/moi" className="btn btn-secondary">💿 Tạo album</Link>
          <Link href="/playlist" className="btn btn-secondary">♫ Playlist</Link>
          <Link href="/ho-so" className="btn btn-secondary">👤 Hồ sơ</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">Bài viết của tôi ({posts.length})</h2>
        <div className={box}>
          {posts.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/bai-viet/${p.slug}`} className="font-medium text-ink hover:underline">{p.title}</Link>
                <span className="ml-2 text-xs text-muted">{p.file_name && "📎 · "}👁 {formatCount(p.view_count)}</span>
                {p.tags.length > 0 && <div className="mt-1 flex flex-wrap gap-1.5">{p.tags.map((t) => <span key={t} className="chip">#{t}</span>)}</div>}
                <p className="mt-0.5 text-xs text-muted"><Times created={p.created_at} updated={p.updated_at} /></p>
              </div>
              <Status ok={p.is_published} />
              <Link href={`/sua-bai/${p.id}`} className="btn btn-secondary !py-1.5">✏️ Sửa</Link>
              <button type="button" className="btn btn-danger !py-1.5"
                onClick={async () => { if (confirm("Xoá bài này (kèm tệp đính kèm và ảnh trong bài)?")) { await deletePost(p); load(); } }}>Xoá</button>
            </div>
          ))}
          {!posts.length && <p className="p-4 text-sm text-muted">Chưa có bài viết.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">Album của tôi ({albums.length})</h2>
        <div className={box}>
          {albums.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/album/${a.id}`} className="font-medium text-ink hover:underline">💿 {a.title}</Link>
                <p className="mt-0.5 text-xs text-muted"><Times created={a.created_at} updated={a.updated_at} verb="Tạo" /></p>
              </div>
              <Link href={`/album/sua/${a.id}`} className="btn btn-secondary !py-1.5">✏️ Sửa</Link>
              <button type="button" className="btn btn-danger !py-1.5"
                onClick={async () => { if (confirm("Xoá album? Bài hát vẫn được giữ lại.")) { await deleteAlbum(a); load(); } }}>Xoá</button>
            </div>
          ))}
          {!albums.length && <p className="p-4 text-sm text-muted">Chưa có album.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">Nhạc của tôi ({songs.length})</h2>
        <div className={box}>
          {songs.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/bai-hat/${s.id}`} className="font-medium text-ink hover:underline">{s.title}</Link>
                <span className="ml-2 text-xs text-muted">
                  {s.artist}{s.album_info && ` · ${s.album_info.title}`} · ▶ {formatCount(s.play_count)}{s.lyrics ? " · có lời" : ""}
                </span>
                <p className="mt-0.5 text-xs text-muted"><Times created={s.created_at} updated={s.updated_at} verb="Tải lên" /></p>
              </div>
              <Status ok={s.is_published} />
              <Link href={`/sua-nhac/${s.id}`} className="btn btn-secondary !py-1.5">✏️ Sửa</Link>
              <button type="button" className="btn btn-danger !py-1.5"
                onClick={async () => { if (confirm("Xoá bài hát này (kèm tệp nhạc và ảnh bìa)?")) { await deleteSong(s); load(); } }}>Xoá</button>
            </div>
          ))}
          {!songs.length && <p className="p-4 text-sm text-muted">Chưa có bài hát.</p>}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return <RequireAuth><Dashboard /></RequireAuth>;
}
