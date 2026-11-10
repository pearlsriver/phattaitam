# Phật Tại Tâm v0.9 — Single (album solo) + tải ảnh bìa chỉ dành cho quản trị viên

## 1. Chạy SQL trước (bắt buộc)
Supabase → SQL Editor → mở supabase\migration_v8_solo.sql trong VS Code → Ctrl+A, Ctrl+C → dán → Run.
Kết quả cuối cùng phải hiện:  songs_without_album = 0
Nếu báo lỗi giữa chừng, chạy ngay dòng này để bật lại trigger ngày sửa, rồi gửi lỗi cho Copilot:
    alter table public.songs enable trigger songs_touch_updated_at;

Kiểm tra thêm (không bắt buộc):
    select a.title, a.is_solo, s.title as song from public.albums a join public.songs s on s.album_id = a.id where a.is_solo limit 20;

## 2. Chép code
Giải nén đè lên D:\GitHub\phattaitam (Replace) → Remove-Item -Recurse -Force .next ; npm run dev

## 3. Đưa lên mạng
npm run build   (thành công) →  git add . ; git commit -m "v0.9 single album, admin cover download" ; git push
(Chạy SQL ở bước 1 trên cùng project Supabase là đủ cho cả localhost lẫn phattaitam.com.)
