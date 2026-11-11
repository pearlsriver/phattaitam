-- =====================================================================
-- PHẬT TẠI TÂM v0.11 — Gói A + B
--   A. 4 cấp thành viên (Mới / VIP / Admin / Super Admin), quản lý thành viên,
--      thời lượng bài hát
--   B. Cài đặt trang (Chế độ chỉnh sửa cho Super Admin)
-- Chạy 1 lần trong Supabase → SQL Editor. An toàn nếu chạy lại.
-- =====================================================================

-- 1) CẤP THÀNH VIÊN ----------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
-- Admin hiện tại trở thành Super Admin (người sáng lập)
update public.profiles set role = 'super_admin' where role = 'admin';
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'vip', 'admin', 'super_admin'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'super_admin'));
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin');
$$;

-- VIP, Admin, Super Admin: đăng bài không cần duyệt
create or replace function public.can_publish()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('vip', 'admin', 'super_admin'));
$$;

-- 2) QUY TẮC ĐĂNG BÀI / NHẠC (kiểm tra ở cơ sở dữ liệu) -------------------
drop policy if exists "insert posts" on public.posts;
create policy "insert posts" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (is_published = false or public.can_publish()));
drop policy if exists "update posts" on public.posts;
create policy "update posts" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (author_id = auth.uid() and (is_published = false or public.can_publish())));

drop policy if exists "insert songs" on public.songs;
create policy "insert songs" on public.songs for insert to authenticated
  with check (uploader_id = auth.uid() and (is_published = false or public.can_publish()));
drop policy if exists "update songs" on public.songs;
create policy "update songs" on public.songs for update to authenticated
  using (uploader_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (uploader_id = auth.uid() and (is_published = false or public.can_publish())));

-- 3) QUẢN LÝ THÀNH VIÊN (chỉ Admin / Super Admin) -----------------------
-- Danh sách kèm email — email KHÔNG lộ ra cho người dùng thường
create or replace function public.admin_list_members()
returns table (
  id uuid, full_name text, avatar_url text, role text, email text,
  created_at timestamptz, last_sign_in_at timestamptz, post_count bigint, song_count bigint
)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Chỉ quản trị viên được xem danh sách thành viên.' using errcode = '42501';
  end if;
  return query
    select p.id, p.full_name, p.avatar_url, p.role, u.email::text, p.created_at, u.last_sign_in_at,
           (select count(*) from public.posts x where x.author_id = p.id),
           (select count(*) from public.songs y where y.uploader_id = p.id)
    from public.profiles p
    left join auth.users u on u.id = p.id
    order by p.created_at desc;
end; $$;
revoke all on function public.admin_list_members() from public, anon;
grant execute on function public.admin_list_members() to authenticated;

-- Đổi cấp thành viên
--   Admin: chỉ đổi giữa Thành viên mới <-> VIP (và không đụng tới Admin khác)
--   Super Admin: đổi mọi cấp; không được hạ Super Admin cuối cùng
create or replace function public.admin_set_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
declare
  me  text;
  cur text;
begin
  perform pg_advisory_xact_lock(hashtext('phattaitam_roles'));
  select role into me from public.profiles where id = auth.uid();
  if new_role not in ('user', 'vip', 'admin', 'super_admin') then
    raise exception 'Cấp thành viên không hợp lệ.';
  end if;
  select role into cur from public.profiles where id = target for update;
  if cur is null then raise exception 'Không tìm thấy thành viên.'; end if;

  if me = 'super_admin' then
    null;
  elsif me = 'admin' then
    if cur not in ('user', 'vip') or new_role not in ('user', 'vip') then
      raise exception 'Chỉ Super Admin mới thay đổi được quyền quản trị.';
    end if;
  else
    raise exception 'Bạn không có quyền thay đổi cấp thành viên.' using errcode = '42501';
  end if;

  if cur = 'super_admin' and new_role <> 'super_admin'
     and (select count(*) from public.profiles where role = 'super_admin') <= 1 then
    raise exception 'Không thể hạ quyền Super Admin cuối cùng.';
  end if;

  update public.profiles set role = new_role where id = target;
end; $$;
revoke all on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- Sửa tên hiển thị của thành viên
create or replace function public.admin_update_member(target uuid, new_name text)
returns void language plpgsql security definer set search_path = public as $$
declare cur text;
begin
  if not public.is_admin() then
    raise exception 'Bạn không có quyền sửa thông tin thành viên.' using errcode = '42501';
  end if;
  select role into cur from public.profiles where id = target;
  if cur is null then raise exception 'Không tìm thấy thành viên.'; end if;
  if cur in ('admin', 'super_admin') and not public.is_super_admin() and target <> auth.uid() then
    raise exception 'Chỉ Super Admin mới sửa được thông tin quản trị viên khác.';
  end if;
  update public.profiles
     set full_name = nullif(left(trim(coalesce(new_name, '')), 80), '')
   where id = target;
end; $$;
revoke all on function public.admin_update_member(uuid, text) from public, anon;
grant execute on function public.admin_update_member(uuid, text) to authenticated;

-- 4) THỜI LƯỢNG BÀI HÁT ------------------------------------------------
alter table public.songs add column if not exists duration_seconds real;

-- Ghi thời lượng cho bài chưa có (chỉ người tải lên hoặc quản trị viên)
create or replace function public.set_song_duration(s_id uuid, secs real)
returns void language sql security definer set search_path = public as $$
  update public.songs
     set duration_seconds = secs
   where id = s_id
     and secs > 0 and secs < 36000
     and (public.is_admin() or uploader_id = auth.uid());
$$;
revoke all on function public.set_song_duration(uuid, real) from public, anon;
grant execute on function public.set_song_duration(uuid, real) to authenticated;

-- 5) CÀI ĐẶT TRANG (Gói B) — chỉ Super Admin được sửa ---------------------
create table if not exists public.site_settings (
  key text primary key check (char_length(key) <= 100),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
alter table public.site_settings enable row level security;

drop policy if exists "read site settings" on public.site_settings;
create policy "read site settings" on public.site_settings for select using (true);
drop policy if exists "super admin write site settings" on public.site_settings;
create policy "super admin write site settings" on public.site_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- 6) KIỂM TRA ------------------------------------------------------------
select role, count(*) from public.profiles group by role order by role;

-- Nếu kết quả KHÔNG có dòng super_admin, chạy lệnh sau (đổi email):
-- update public.profiles set role = 'super_admin'
--   where id = (select id from auth.users where lower(email) = lower('email-cua-ban@gmail.com'));
