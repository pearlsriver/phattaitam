-- =====================================================================
-- PHẬT TẠI TÂM v0.15 — Vá lỗi bảo mật
-- Chạy 1 lần trong Supabase → SQL Editor. An toàn nếu chạy lại.
-- Không xoá dữ liệu. Các ràng buộc độ dài dùng NOT VALID: chỉ áp dụng cho dữ liệu MỚI.
-- =====================================================================

-- 1) THU HỒI QUYỀN THỪA --------------------------------------------------
-- Mặc định Supabase cấp mọi quyền (kể cả TRUNCATE — không bị RLS kiểm soát) cho anon/authenticated.
-- Khách (anon) không bao giờ cần ghi trực tiếp vào bảng.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.tablename);
    execute format('revoke insert, update, delete on public.%I from anon', t.tablename);
  end loop;
end $$;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- 2) GIỚI HẠN ĐỘ DÀI / ĐỊNH DẠNG (chống nhồi dữ liệu, ảnh theo dõi qua http) -----
alter table public.posts drop constraint if exists posts_len_chk;
alter table public.posts add constraint posts_len_chk check (
  char_length(title) between 1 and 300
  and (excerpt is null or char_length(excerpt) <= 1000)
  and char_length(content) <= 300000
  and (author_name is null or char_length(author_name) <= 200)
  and cardinality(tags) <= 10
  and (cover_image is null or (cover_image ~ '^https://' and char_length(cover_image) <= 1000))
) not valid;

alter table public.songs drop constraint if exists songs_len_chk;
alter table public.songs add constraint songs_len_chk check (
  char_length(title) between 1 and 300
  and (artist is null or char_length(artist) <= 200)
  and (lyrics is null or char_length(lyrics) <= 30000)
) not valid;

alter table public.albums drop constraint if exists albums_len_chk;
alter table public.albums add constraint albums_len_chk check (
  char_length(title) between 1 and 300
  and (description is null or char_length(description) <= 5000)
) not valid;

alter table public.profiles drop constraint if exists profiles_len_chk;
alter table public.profiles add constraint profiles_len_chk check (
  (full_name is null or char_length(full_name) <= 80)
  and (bio is null or char_length(bio) <= 1000)
  and (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 1000))
) not valid;

alter table public.playlists drop constraint if exists playlists_len_chk;
alter table public.playlists add constraint playlists_len_chk check (char_length(title) between 1 and 200) not valid;

-- 3) CHỐNG GẮN TỆP / ALBUM CỦA NGƯỜI KHÁC, KHOÁ LƯỢT NGHE / LƯỢT ĐỌC ----------
-- (Chỉ áp dụng khi người dùng ghi trực tiếp; hàm hệ thống và Admin được bỏ qua.)
create or replace function public.enforce_content_rules()
returns trigger language plpgsql set search_path = public as $$
declare
  owner uuid;
begin
  if current_user <> 'authenticated' or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'songs' then
    owner := new.uploader_id;
    if (tg_op = 'INSERT' or new.audio_path is distinct from old.audio_path)
       and new.audio_path not like owner::text || '/%' then
      raise exception 'Tệp nhạc không hợp lệ.' using errcode = '42501';
    end if;
    if new.cover_path is not null and (tg_op = 'INSERT' or new.cover_path is distinct from old.cover_path)
       and new.cover_path not like owner::text || '/%' then
      raise exception 'Ảnh bìa không hợp lệ.' using errcode = '42501';
    end if;
    if new.album_id is not null and (tg_op = 'INSERT' or new.album_id is distinct from old.album_id)
       and not exists (select 1 from public.albums a where a.id = new.album_id and a.owner_id = owner) then
      raise exception 'Bạn chỉ có thể thêm bài vào album của mình.' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' then new.play_count := 0; else new.play_count := old.play_count; end if;

  elsif tg_table_name = 'posts' then
    owner := new.author_id;
    if new.file_path is not null and (tg_op = 'INSERT' or new.file_path is distinct from old.file_path)
       and new.file_path not like owner::text || '/%' then
      raise exception 'Tệp đính kèm không hợp lệ.' using errcode = '42501';
    end if;
    if tg_op = 'INSERT' then new.view_count := 0; else new.view_count := old.view_count; end if;

  elsif tg_table_name = 'albums' then
    owner := new.owner_id;
    if new.cover_path is not null and (tg_op = 'INSERT' or new.cover_path is distinct from old.cover_path)
       and new.cover_path not like owner::text || '/%' then
      raise exception 'Ảnh bìa không hợp lệ.' using errcode = '42501';
    end if;
    -- Đĩa đơn chỉ do hệ thống tạo
    if tg_op = 'INSERT' then new.is_solo := false; else new.is_solo := old.is_solo; end if;
  end if;

  return new;
end; $$;

-- Tên bắt đầu bằng "zz_" để chạy SAU trigger tự tạo Đĩa đơn
drop trigger if exists zz_enforce_content_rules on public.songs;
create trigger zz_enforce_content_rules before insert or update on public.songs
  for each row execute function public.enforce_content_rules();
drop trigger if exists zz_enforce_content_rules on public.posts;
create trigger zz_enforce_content_rules before insert or update on public.posts
  for each row execute function public.enforce_content_rules();
drop trigger if exists zz_enforce_content_rules on public.albums;
create trigger zz_enforce_content_rules before insert or update on public.albums
  for each row execute function public.enforce_content_rules();

-- 4) GIỚI HẠN TẦN SUẤT (chống spam). Admin không bị giới hạn. --------------
create or replace function public.enforce_rate_limit()
returns trigger language plpgsql set search_path = public as $$
declare
  r text;
  n int;
  lim int;
  what text;
begin
  if current_user <> 'authenticated' then return new; end if;
  select role into r from public.profiles where id = auth.uid();
  if r in ('admin', 'super_admin') then return new; end if;

  if tg_table_name = 'comments' then
    select count(*) into n from public.comments where user_id = auth.uid() and created_at > now() - interval '1 hour';
    lim := case when r = 'vip' then 60 else 20 end; what := 'bình luận trong 1 giờ';
  elsif tg_table_name = 'posts' then
    select count(*) into n from public.posts where author_id = auth.uid() and created_at > now() - interval '1 day';
    lim := case when r = 'vip' then 50 else 10 end; what := 'bài viết trong 24 giờ';
  elsif tg_table_name = 'songs' then
    select count(*) into n from public.songs where uploader_id = auth.uid() and created_at > now() - interval '1 day';
    lim := case when r = 'vip' then 50 else 10 end; what := 'bài hát trong 24 giờ';
  elsif tg_table_name = 'albums' then
    select count(*) into n from public.albums where owner_id = auth.uid() and not is_solo and created_at > now() - interval '1 day';
    lim := case when r = 'vip' then 30 else 10 end; what := 'album trong 24 giờ';
  elsif tg_table_name = 'playlists' then
    select count(*) into n from public.playlists where owner_id = auth.uid() and created_at > now() - interval '1 day';
    lim := 30; what := 'playlist trong 24 giờ';
  else
    return new;
  end if;

  if n >= lim then
    raise exception 'Bạn đã đạt giới hạn % %. Vui lòng thử lại sau.', lim, what using errcode = '54000';
  end if;
  return new;
end; $$;

do $$
declare t text;
begin
  foreach t in array array['comments', 'posts', 'songs', 'albums', 'playlists'] loop
    execute format('drop trigger if exists rate_limit on public.%I', t);
    execute format('create trigger rate_limit before insert on public.%I for each row execute function public.enforce_rate_limit()', t);
  end loop;
end $$;

-- 5) HẠN MỨC TẢI TỆP LÊN CLOUDFLARE R2 ------------------------------------
create table if not exists public.media_uploads (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  bytes bigint not null,
  created_at timestamptz not null default now()
);
create index if not exists media_uploads_user_idx on public.media_uploads (user_id, created_at);
alter table public.media_uploads enable row level security;   -- không có policy: chỉ hàm dưới truy cập được
revoke all on public.media_uploads from anon, authenticated;

-- Thành viên mới: 300 MB / 60 tệp mỗi 24 giờ · VIP: 2 GB / 300 tệp · Admin: không giới hạn
create or replace function public.register_upload(p_bytes bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  r text;
  used bigint;
  cnt int;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập.' using errcode = '42501';
  end if;
  if p_bytes is null or p_bytes <= 0 or p_bytes > 60 * 1024 * 1024 then
    raise exception 'Dung lượng tệp không hợp lệ.';
  end if;
  select role into r from public.profiles where id = auth.uid();
  if r is null then
    raise exception 'Không tìm thấy tài khoản.' using errcode = '42501';
  end if;

  if r not in ('admin', 'super_admin') then
    select coalesce(sum(bytes), 0), count(*) into used, cnt
      from public.media_uploads where user_id = auth.uid() and created_at > now() - interval '1 day';
    if cnt >= (case when r = 'vip' then 300 else 60 end)
       or used + p_bytes > (case when r = 'vip' then 2147483648 else 314572800 end) then
      raise exception 'Bạn đã đạt giới hạn tải lên trong 24 giờ. Vui lòng thử lại sau.' using errcode = '54000';
    end if;
  end if;

  insert into public.media_uploads (user_id, bytes) values (auth.uid(), p_bytes);
  delete from public.media_uploads where user_id = auth.uid() and created_at < now() - interval '7 days';
end; $$;
revoke all on function public.register_upload(bigint) from public, anon;
grant execute on function public.register_upload(bigint) to authenticated;

-- 6) SUPABASE STORAGE: ngừng nhận tệp mới (media đã chuyển sang Cloudflare R2) ---
drop policy if exists "upload own folder" on storage.objects;

-- 7) KIỂM TRA -------------------------------------------------------------
select table_name, string_agg(privilege_type, ',' order by privilege_type) as anon_privs
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name order by table_name;
-- Kết quả đúng: mỗi bảng chỉ còn SELECT (media_uploads không xuất hiện).
