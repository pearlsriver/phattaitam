# Phật Tại Tâm v0.16 — Công khai / Chỉ người có link / Riêng tư + Kéo-thả tệp

1. Supabase → SQL Editor → chạy supabase\migration_v13_visibility.sql (SAU v0.15). Nội dung cũ giữ "Công khai".
2. Giải nén đè lên D:\GitHub\phattaitam (Replace).
3. Remove-Item -Recurse -Force .next ; npm run dev
4. Thử: tạo 1 bài "Chỉ người có link" → chép link → mở bằng cửa sổ ẩn danh (không đăng nhập) → phải xem được.
   Bỏ "?k=..." khỏi link → phải báo không tìm thấy. Bài "Riêng tư" → cửa sổ ẩn danh không xem được.
5. npm run build → git add . ; git commit -m "v0.16 visibility, drag-drop" ; git push
