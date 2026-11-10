-- =====================================================================
-- PHẬT TẠI TÂM v0.9 — Mỗi bài hát không có album sẽ tự thành "Single" (album solo)
-- Chạy 1 lần trong Supabase → SQL Editor. An toàn nếu chạy lại.
-- =====================================================================

-- 1) Đánh dấu album solo ---------------------------------------------
alter table public.albums add column if not exists is_solo boolean not null default false;
create index if not exists albums_solo_idx on public.albums (is_solo);

-- Album solo chỉ hiện công khai khi bài hát của nó đã được duyệt
-- (tránh lộ tên bài hát đang chờ duyệt vì album solo lấy tên theo bài hát)
drop policy if exists "read albums" on public.albums;
create policy "read albums" on public.albums for select using (
  not is_solo
  or owner_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.songs s where s.album_id = albums.id and s.is_published)
);

-- 2) Tự tạo album solo khi bài hát chưa thuộc album nào ----------------
create or replace function public.songs_ensure_album()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_album uuid;
begin
  -- (bỏ qua nếu chủ bài hát đã bị xoá — đang xoá tài khoản kéo theo xoá bài)
  if new.album_id is null and exists (select 1 from public.profiles p where p.id = new.uploader_id) then
    insert into public.albums (owner_id, title, is_solo, created_at, updated_at)
    values (new.uploader_id, new.title, true, coalesce(new.created_at, now()), now())
    returning id into new_album;
    new.album_id := new_album;
  end if;
  return new;
end; $$;

drop trigger if exists songs_ensure_album on public.songs;
create trigger songs_ensure_album
  before insert or update of album_id on public.songs
  for each row when (new.album_id is null)
  execute function public.songs_ensure_album();

-- 3) Đổi tên bài hát -> đổi tên album solo; chuyển bài sang album khác -> xoá album solo cũ (rỗng)
create or replace function public.songs_sync_solo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.album_id is not null and new.title is distinct from old.title then
    update public.albums set title = new.title where id = new.album_id and is_solo;
  end if;
  if old.album_id is not null and old.album_id is distinct from new.album_id then
    delete from public.albums a
    where a.id = old.album_id and a.is_solo
      and not exists (select 1 from public.songs s where s.album_id = a.id);
  end if;
  return new;
end; $$;

drop trigger if exists songs_sync_solo on public.songs;
create trigger songs_sync_solo
  after update of title, album_id on public.songs
  for each row execute function public.songs_sync_solo();

-- 4) Xoá bài hát -> xoá album solo của nó
create or replace function public.songs_cleanup_solo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.album_id is not null then
    delete from public.albums a
    where a.id = old.album_id and a.is_solo
      and not exists (select 1 from public.songs s where s.album_id = a.id);
  end if;
  return old;
end; $$;

drop trigger if exists songs_cleanup_solo on public.songs;
create trigger songs_cleanup_solo
  after delete on public.songs
  for each row execute function public.songs_cleanup_solo();

-- 5) Chuyển các bài hát hiện có (chưa thuộc album nào) thành album solo ---
-- Tạm tắt trigger "ngày sửa" để các bài không bị hiện "Sửa lần cuối" vì thay đổi này.
alter table public.songs disable trigger songs_touch_updated_at;

update public.songs set album_id = null where album_id is null;   -- kích hoạt trigger tạo album solo

alter table public.songs enable trigger songs_touch_updated_at;

-- 6) Kiểm tra: kết quả phải là 0
select count(*) as songs_without_album from public.songs where album_id is null;
