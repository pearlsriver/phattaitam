-- =====================================================================
-- CHẠY SAU KHI đã chạy scripts/migrate-supabase-to-r2.mjs thành công.
-- Đổi địa chỉ ảnh nhúng trong bài viết / ảnh đại diện từ Supabase -> Cloudflare.
-- ĐỔI 'https://media.phattaitam.com' nếu bạn dùng tên miền media khác.
-- =====================================================================
update public.posts
set content     = replace(content,     'https://cxjdychokmbaqarcgykk.supabase.co/storage/v1/object/public/images/', 'https://media.phattaitam.com/images/'),
    cover_image = replace(cover_image, 'https://cxjdychokmbaqarcgykk.supabase.co/storage/v1/object/public/images/', 'https://media.phattaitam.com/images/')
where content like '%/storage/v1/object/public/images/%' or cover_image like '%/storage/v1/object/public/images/%';

update public.profiles
set avatar_url = replace(avatar_url, 'https://cxjdychokmbaqarcgykk.supabase.co/storage/v1/object/public/images/', 'https://media.phattaitam.com/images/')
where avatar_url like '%/storage/v1/object/public/images/%';
