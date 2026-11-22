-- =====================================================================
-- PHẬT TẠI TÂM v0.16 — Chế độ hiển thị: Công khai / Chỉ người có link / Riêng tư
-- Chạy 1 lần trong Supabase → SQL Editor (SAU v0.15). An toàn nếu chạy lại.
-- Nội dung hiện có giữ nguyên "Công khai".
-- =====================================================================

-- 1) CỘT MỚI ------------------------------------------------------------
alter table public.posts add column if not exists visibility text not null default 'public';
alter table public.posts add column if not exists share_token uuid not null default gen_random_uuid();
alter table public.songs add column if not exists visibility text not null default 'public';
alter table public.songs add column if not exists share_token uuid not null default gen_random_uuid();

alter table public.posts drop constraint if exists posts_visibility_chk;
alter table public.posts add constraint posts_visibility_chk check (visibility in ('public', 'unlisted', 'private'));
alter table public.songs drop constraint if exists songs_visibility_chk;
alter table public.songs add constraint songs_visibility_chk check (visibility in ('public', 'unlisted', 'private'));

create unique index if not exists posts_share_token_idx on public.posts (share_token);
create unique index if not exists songs_share_token_idx on public.songs (share_token);

-- 2) AI ĐƯỢC ĐỌC ----------------------------------------------------------
-- Người khác chỉ đọc trực tiếp được nội dung CÔNG KHAI đã duyệt.
-- Nội dung "Chỉ người có link" chỉ mở được qua hàm get_shared_* bằng mã bí mật trong link.
drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select
  using ((is_published and visibility = 'public') or author_id = auth.uid() or public.is_admin());

drop policy if exists "read songs" on public.songs;
create policy "read songs" on public.songs for select
  using ((is_published and visibility = 'public') or uploader_id = auth.uid() or public.is_admin());

drop policy if exists "read albums" on public.albums;
create policy "read albums" on public.albums for select using (
  not is_solo
  or owner_id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.songs s where s.album_id = albums.id and s.is_published and s.visibility = 'public')
);

-- 3) MÃ LINK CHIA SẺ: tự đổi khi đổi chế độ hiển thị; người dùng không tự đặt được
create or replace function public.rotate_share_token()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.share_token := gen_random_uuid();
  elsif new.visibility is distinct from old.visibility then
    new.share_token := gen_random_uuid();            -- link cũ hết hiệu lực
  elsif current_user = 'authenticated' then
    new.share_token := old.share_token;              -- chỉ đổi được qua hàm regenerate_share_token
  end if;
  return new;
end; $$;

drop trigger if exists rotate_share_token on public.posts;
create trigger rotate_share_token before insert or update on public.posts
  for each row execute function public.rotate_share_token();
drop trigger if exists rotate_share_token on public.songs;
create trigger rotate_share_token before insert or update on public.songs
  for each row execute function public.rotate_share_token();

-- 4) MỞ NỘI DUNG BẰNG LINK CHIA SẺ ----------------------------------------
create or replace function public.get_shared_post(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(p) || jsonb_build_object('author',
           (select jsonb_build_object('full_name', pr.full_name, 'avatar_url', pr.avatar_url)
              from public.profiles pr where pr.id = p.author_id))
  from public.posts p
  where p.share_token = p_token and p.visibility = 'unlisted' and p.is_published;
$$;

create or replace function public.get_shared_song(p_token uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(s) || jsonb_build_object('album_info',
           (select jsonb_build_object('id', a.id, 'title', a.title, 'cover_path', a.cover_path, 'is_solo', a.is_solo)
              from public.albums a where a.id = s.album_id))
  from public.songs s
  where s.share_token = p_token and s.visibility = 'unlisted' and s.is_published;
$$;

revoke all on function public.get_shared_post(uuid) from public;
revoke all on function public.get_shared_song(uuid) from public;
grant execute on function public.get_shared_post(uuid) to anon, authenticated;
grant execute on function public.get_shared_song(uuid) to anon, authenticated;

-- 5) TẠO LINK MỚI (link cũ không mở được nữa) — chỉ chủ nội dung hoặc Admin
create or replace function public.regenerate_share_token(p_kind text, p_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid := gen_random_uuid();
begin
  if p_kind = 'post' then
    update public.posts set share_token = t where id = p_id and (author_id = auth.uid() or public.is_admin());
  elsif p_kind = 'song' then
    update public.songs set share_token = t where id = p_id and (uploader_id = auth.uid() or public.is_admin());
  else
    raise exception 'Loại nội dung không hợp lệ.';
  end if;
  if not found then
    raise exception 'Bạn không có quyền với nội dung này.' using errcode = '42501';
  end if;
  return t;
end; $$;
revoke all on function public.regenerate_share_token(text, uuid) from public, anon;
grant execute on function public.regenerate_share_token(text, uuid) to authenticated;

-- 6) KIỂM TRA ---------------------------------------------------------------
select 'posts' as bang, visibility, count(*) from public.posts group by visibility
union all
select 'songs', visibility, count(*) from public.songs group by visibility;
