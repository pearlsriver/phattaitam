-- =====================================================================
-- PHẬT TẠI TÂM v0.5 — Album, playlist, lời bài hát, hồ sơ, yêu thích,
-- bình luận, lượt nghe/đọc, ảnh trong bài viết.  Chạy 1 lần, SAU v4.
-- =====================================================================

-- 1) HỒ SƠ ------------------------------------------------------------
alter table public.profiles add column if not exists bio text;
grant update (full_name, avatar_url, bio) on public.profiles to authenticated;

-- 2) BUCKET ẢNH (ảnh trong bài, ảnh đại diện, bìa album) --------------
insert into storage.buckets (id, name, public) values ('images','images',true)
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects for select
  using (bucket_id in ('books','music','covers','images'));
drop policy if exists "upload own folder" on storage.objects;
create policy "upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id in ('books','music','covers','images')
              and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own files" on storage.objects;
create policy "delete own files" on storage.objects for delete to authenticated
  using (bucket_id in ('books','music','covers','images')
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 3) ALBUM ------------------------------------------------------------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.albums enable row level security;
drop policy if exists "read albums" on public.albums;
create policy "read albums" on public.albums for select using (true);
drop policy if exists "insert albums" on public.albums;
create policy "insert albums" on public.albums for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists "update albums" on public.albums;
create policy "update albums" on public.albums for update to authenticated
  using (owner_id = auth.uid() or public.is_admin());
drop policy if exists "delete albums" on public.albums;
create policy "delete albums" on public.albums for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

create or replace function public.touch_album_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;
drop trigger if exists albums_touch_updated_at on public.albums;
create trigger albums_touch_updated_at before update on public.albums
  for each row execute procedure public.touch_album_updated_at();

-- 4) BÀI HÁT: album, lời, số thứ tự, lượt nghe ------------------------
alter table public.songs add column if not exists album_id uuid references public.albums(id) on delete set null;
alter table public.songs add column if not exists lyrics text;
alter table public.songs add column if not exists track_no int;
alter table public.songs add column if not exists play_count int not null default 0;

-- Chuyển tên album cũ (dạng chữ) thành album thật
insert into public.albums (owner_id, title)
select distinct s.uploader_id, trim(s.album)
from public.songs s
where s.album is not null and trim(s.album) <> ''
  and not exists (select 1 from public.albums a where a.owner_id = s.uploader_id and a.title = trim(s.album));
update public.songs s set album_id = a.id
from public.albums a
where s.album_id is null and a.owner_id = s.uploader_id and a.title = trim(s.album);

create or replace function public.touch_song_updated_at()
returns trigger language plpgsql as $$
begin
  if (new.title, new.artist, new.album_id, new.lyrics, new.track_no, new.audio_path, new.cover_path)
     is distinct from (old.title, old.artist, old.album_id, old.lyrics, old.track_no, old.audio_path, old.cover_path) then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end; $$;

-- 5) BÀI VIẾT: lượt đọc, ảnh đại diện ----------------------------------
alter table public.posts add column if not exists view_count int not null default 0;
alter table public.posts add column if not exists cover_image text;

-- 6) ĐẾM LƯỢT ĐỌC / NGHE (ai cũng gọi được, chỉ tăng 1) ----------------
create or replace function public.increment_post_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set view_count = view_count + 1 where id = p_id and is_published;
$$;
create or replace function public.increment_song_play(s_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.songs set play_count = play_count + 1 where id = s_id and is_published;
$$;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;
grant execute on function public.increment_song_play(uuid) to anon, authenticated;

-- 7) YÊU THÍCH ---------------------------------------------------------
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','song','album')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);
create index if not exists likes_target_idx on public.likes (target_type, target_id);
alter table public.likes enable row level security;
drop policy if exists "read likes" on public.likes;
create policy "read likes" on public.likes for select using (true);
drop policy if exists "like" on public.likes;
create policy "like" on public.likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "unlike" on public.likes;
create policy "unlike" on public.likes for delete to authenticated using (user_id = auth.uid());

-- 8) BÌNH LUẬN ---------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post','song','album')),
  target_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_target_idx on public.comments (target_type, target_id, created_at);
alter table public.comments enable row level security;
drop policy if exists "read comments" on public.comments;
create policy "read comments" on public.comments for select using (true);
drop policy if exists "write comment" on public.comments;
create policy "write comment" on public.comments for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "delete comment" on public.comments;
create policy "delete comment" on public.comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- 9) PLAYLIST ----------------------------------------------------------
create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.playlist_songs (
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (playlist_id, song_id)
);
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;

drop policy if exists "read playlists" on public.playlists;
create policy "read playlists" on public.playlists for select using (is_public or owner_id = auth.uid());
drop policy if exists "insert playlists" on public.playlists;
create policy "insert playlists" on public.playlists for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "update playlists" on public.playlists;
create policy "update playlists" on public.playlists for update to authenticated using (owner_id = auth.uid());
drop policy if exists "delete playlists" on public.playlists;
create policy "delete playlists" on public.playlists for delete to authenticated using (owner_id = auth.uid());

drop policy if exists "read playlist songs" on public.playlist_songs;
create policy "read playlist songs" on public.playlist_songs for select using (
  exists (select 1 from public.playlists p where p.id = playlist_id and (p.is_public or p.owner_id = auth.uid())));
drop policy if exists "add playlist songs" on public.playlist_songs;
create policy "add playlist songs" on public.playlist_songs for insert to authenticated with check (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));
drop policy if exists "remove playlist songs" on public.playlist_songs;
create policy "remove playlist songs" on public.playlist_songs for delete to authenticated using (
  exists (select 1 from public.playlists p where p.id = playlist_id and p.owner_id = auth.uid()));
