"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AlbumCard from "@/components/music/AlbumCard";
import SongCard from "@/components/music/SongCard";
import { usePlayer } from "@/components/music/PlayerProvider";
import PostCard from "@/components/posts/PostCard";
import Avatar from "@/components/social/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { listAlbumsByOwner } from "@/services/albumService";
import { listPostsByAuthor } from "@/services/postService";
import { getPublicProfile } from "@/services/profileService";
import { listSongsByUploader } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Post } from "@/types/post";
import type { Profile } from "@/types/profile";
import type { Song } from "@/types/song";
import { formatDate } from "@/utils/formatDate";

export default function AuthorPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { playSong, current } = usePlayer();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "notfound">("loading");
  const [tab, setTab] = useState<"posts" | "music">("posts");

  useEffect(() => {
    Promise.all([getPublicProfile(id), listPostsByAuthor(id), listSongsByUploader(id), listAlbumsByOwner(id)])
      .then(([p, ps, ss, as]) => {
        setProfile(p);
        setPosts(ps);
        setSongs(ss);
        setAlbums(as);
        setState(p ? "ok" : "notfound");
        if (!ps.length && (ss.length || as.length)) setTab("music");
      })
      .catch(() => setState("notfound"));
  }, [id]);

  if (state === "loading") return <p className="py-16 text-center text-muted">Đang tải…</p>;
  if (!profile) return <p className="py-16 text-center text-ink-soft">Không tìm thấy tác giả.</p>;

  const tabCls = (on: boolean) => `rounded-full px-4 py-2 text-sm ${on ? "bg-ink text-paper" : "border border-line text-ink-soft hover:bg-soft"}`;

  return (
    <div>
      <section className="hero-glow flex flex-col items-center gap-6 rounded-[2rem] border border-line p-8 text-center md:flex-row md:text-left">
        <Avatar url={profile.avatar_url} name={profile.full_name} size={120} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Tác giả</p>
          <h1 className="mt-1 font-serif text-4xl font-semibold text-ink">{profile.full_name ?? "Ẩn danh"}</h1>
          {profile.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-ink-soft">{profile.bio}</p>}
          <p className="mt-3 text-sm text-muted">
            {posts.length} bài viết · {songs.length} bài hát · {albums.length} album · tham gia {formatDate(profile.created_at)}
          </p>
        </div>
        {user?.id === profile.id && <Link href="/ho-so" className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:bg-soft">✏️ Sửa hồ sơ</Link>}
      </section>

      <div className="my-8 flex gap-2">
        <button type="button" className={tabCls(tab === "posts")} onClick={() => setTab("posts")}>Bài viết ({posts.length})</button>
        <button type="button" className={tabCls(tab === "music")} onClick={() => setTab("music")}>Âm nhạc ({songs.length})</button>
      </div>

      {tab === "posts" ? (
        posts.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
        ) : (
          <p className="text-muted">Chưa có bài viết.</p>
        )
      ) : (
        <div className="space-y-10">
          {albums.length > 0 && (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">{albums.map((a) => <AlbumCard key={a.id} album={a} />)}</div>
          )}
          <div className="grid gap-3 lg:grid-cols-2">
            {songs.map((s) => (
              <SongCard key={s.id} song={s} active={current?.id === s.id} onPlay={() => playSong(s, songs, profile.full_name ?? undefined)} />
            ))}
          </div>
          {!songs.length && <p className="text-muted">Chưa có bài hát.</p>}
        </div>
      )}
    </div>
  );
}
