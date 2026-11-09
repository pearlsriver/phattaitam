-- =====================================================================
-- PHẬT TẠI TÂM v0.6 — Hashtag + Tác giả, Điều lệ, Radio do quản trị chọn
-- Chạy 1 lần trong Supabase → SQL Editor (SAU v0.5). An toàn nếu chạy lại.
-- =====================================================================

-- 1) BÀI VIẾT: bỏ chuyên mục cứng -> hashtag; thêm "Tác giả" ---------------
alter table public.posts add column if not exists tags text[] not null default '{}';
alter table public.posts add column if not exists author_name text;
alter table public.posts alter column category drop not null;
alter table public.posts drop constraint if exists posts_category_check;

-- Chuyển chuyên mục cũ thành hashtag
update public.posts
set tags = array[
  case category
    when 'van'       then 'văn'
    when 'tho'       then 'thơ'
    when 'kinh-phat' then 'kinh-phật'
    when 'thien'     then 'thiền'
  end]
where cardinality(tags) = 0 and category in ('van','tho','kinh-phat','thien');

-- "Tác giả" mặc định = tên người đăng (có thể sửa sau)
update public.posts p
set author_name = pr.full_name
from public.profiles pr
where p.author_id = pr.id and p.author_name is null;

create index if not exists posts_tags_idx on public.posts using gin (tags);

-- Ngày "sửa lần cuối" cũng thay đổi khi sửa hashtag / tác giả
create or replace function public.touch_post_updated_at()
returns trigger language plpgsql as $$
begin
  if (new.title, new.tags, new.author_name, new.excerpt, new.content, new.file_path)
     is distinct from (old.title, old.tags, old.author_name, old.excerpt, old.content, old.file_path) then
    new.updated_at := now();
  else
    new.updated_at := old.updated_at;
  end if;
  return new;
end; $$;

-- 2) ĐIỀU LỆ: lưu việc đồng ý -----------------------------------------------
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.profiles add column if not exists terms_version text;

-- Người dùng KHÔNG tự ghi được cột này; chỉ qua hàm dưới (ghi giờ máy chủ)
create or replace function public.accept_terms(p_version text)
returns void language sql security definer set search_path = public as $$
  update public.profiles
  set terms_accepted_at = now(), terms_version = p_version
  where id = auth.uid();
$$;
revoke all on function public.accept_terms(text) from public, anon;
grant execute on function public.accept_terms(text) to authenticated;

-- Đăng ký bằng email có ô tích đồng ý -> ghi nhận ngay khi tạo hồ sơ
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, terms_accepted_at, terms_version)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    case when new.raw_user_meta_data->>'terms_version' is not null then now() end,
    new.raw_user_meta_data->>'terms_version'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- 3) RADIO do quản trị viên chọn ----------------------------------------------
create table if not exists public.radio_settings (
  id int primary key default 1 check (id = 1),
  mode text not null default 'all' check (mode in ('all','custom')),
  shuffle boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.radio_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.radio_songs (
  song_id uuid primary key references public.songs(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now()
);

alter table public.radio_settings enable row level security;
alter table public.radio_songs enable row level security;

drop policy if exists "read radio settings" on public.radio_settings;
create policy "read radio settings" on public.radio_settings for select using (true);
drop policy if exists "admin write radio settings" on public.radio_settings;
create policy "admin write radio settings" on public.radio_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read radio songs" on public.radio_songs;
create policy "read radio songs" on public.radio_songs for select using (true);
drop policy if exists "admin write radio songs" on public.radio_songs;
create policy "admin write radio songs" on public.radio_songs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
