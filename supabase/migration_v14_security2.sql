-- =====================================================================
-- PHẬT TẠI TÂM v0.17 — Vá bảo mật đợt 2 (chạy SAU v0.16). An toàn nếu chạy lại.
--   #5 Làm sạch dữ liệu khi đăng ký tài khoản
--   #7 Bình luận: không đọc/ghi được trên nội dung Riêng tư
--   #8 Phải đồng ý Điều lệ mới được đăng bài / nhạc / album / bình luận
-- =====================================================================

-- #5 ------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  nm text := left(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name',
               split_part(new.email, '@', 1))), ''), 80);
  av text := new.raw_user_meta_data->>'avatar_url';
begin
  -- Chỉ nhận ảnh đại diện từ Google; ảnh khác người dùng tự tải lên trong Hồ sơ
  if av is null or av !~ '^https://[a-z0-9.-]+\.googleusercontent\.com/' or char_length(av) > 1000 then
    av := null;
  end if;
  insert into public.profiles (id, full_name, avatar_url, terms_accepted_at, terms_version)
  values (new.id, nm, av,
          case when new.raw_user_meta_data->>'terms_version' is not null then now() end,
          left(new.raw_user_meta_data->>'terms_version', 20))
  on conflict (id) do nothing;
  return new;
end; $$;

-- #7 ------------------------------------------------------------------
create or replace function public.can_view_target(p_type text, p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case p_type
    when 'post' then exists (select 1 from public.posts p where p.id = p_id and
         ((p.is_published and p.visibility <> 'private') or p.author_id = auth.uid() or public.is_admin()))
    when 'song' then exists (select 1 from public.songs s where s.id = p_id and
         ((s.is_published and s.visibility <> 'private') or s.uploader_id = auth.uid() or public.is_admin()))
    when 'album' then exists (select 1 from public.albums a where a.id = p_id)
    else false end;
$$;
grant execute on function public.can_view_target(text, uuid) to anon, authenticated;

drop policy if exists "read comments" on public.comments;
create policy "read comments" on public.comments for select
  using (public.can_view_target(target_type, target_id));

-- #8 ------------------------------------------------------------------
create or replace function public.accepted_terms()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and terms_accepted_at is not null);
$$;
grant execute on function public.accepted_terms() to authenticated;

drop policy if exists "insert posts" on public.posts;
create policy "insert posts" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and public.accepted_terms()
              and (is_published = false or public.can_publish()));

drop policy if exists "insert songs" on public.songs;
create policy "insert songs" on public.songs for insert to authenticated
  with check (uploader_id = auth.uid() and public.accepted_terms()
              and (is_published = false or public.can_publish()));

drop policy if exists "insert albums" on public.albums;
create policy "insert albums" on public.albums for insert to authenticated
  with check (owner_id = auth.uid() and public.accepted_terms());

drop policy if exists "write comment" on public.comments;
create policy "write comment" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.accepted_terms()
              and public.can_view_target(target_type, target_id));

-- KIỂM TRA: phải trả về 4 dòng có chứa accepted_terms
select tablename, policyname from pg_policies
where schemaname = 'public' and with_check like '%accepted_terms%' order by tablename;
