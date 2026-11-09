-- PHẬT TẠI TÂM — schema gốc (đã chạy ở v0.2, KHÔNG cần chạy lại)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  category text not null check (category in ('van','tho','kinh-phat','thien')),
  excerpt text,
  content text not null default '',
  file_path text,
  file_name text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_category_idx on public.posts (category, created_at desc);
alter table public.posts enable row level security;
drop policy if exists "read posts" on public.posts;
create policy "read posts" on public.posts for select
  using (is_published or author_id = auth.uid() or public.is_admin());
drop policy if exists "insert posts" on public.posts;
create policy "insert posts" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and (is_published = false or public.is_admin()));
drop policy if exists "update posts" on public.posts;
create policy "update posts" on public.posts for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (author_id = auth.uid() and is_published = false));
drop policy if exists "delete posts" on public.posts;
create policy "delete posts" on public.posts for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  uploader_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  artist text,
  album text,
  audio_path text not null,
  cover_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.songs enable row level security;
drop policy if exists "read songs" on public.songs;
create policy "read songs" on public.songs for select
  using (is_published or uploader_id = auth.uid() or public.is_admin());
drop policy if exists "insert songs" on public.songs;
create policy "insert songs" on public.songs for insert to authenticated
  with check (uploader_id = auth.uid() and (is_published = false or public.is_admin()));
drop policy if exists "update songs" on public.songs;
create policy "update songs" on public.songs for update to authenticated
  using (uploader_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (uploader_id = auth.uid() and is_published = false));
drop policy if exists "delete songs" on public.songs;
create policy "delete songs" on public.songs for delete to authenticated
  using (uploader_id = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public)
values ('books','books',true), ('music','music',true), ('covers','covers',true)
on conflict (id) do nothing;
