# Phật Tại Tâm v0.15 — Vá lỗi bảo mật

## Bước 1. Cài thư viện lọc mã độc (bắt buộc, làm trước khi chép code)
PowerShell tại D:\GitHub\phattaitam:
    npm install dompurify

## Bước 2. Chạy SQL
Supabase → SQL Editor → mở supabase\migration_v12_security.sql → Ctrl+A, Ctrl+C → dán → Run.
Kết quả cuối: mỗi bảng chỉ còn quyền SELECT cho anon.

## Bước 3. Chép code
Giải nén đè lên D:\GitHub\phattaitam (Replace). Có thêm tệp mới ở gốc dự án: next.config.ts
Remove-Item -Recurse -Force .next ; npm run dev

## Bước 4. Kiểm tra trên máy (quan trọng)
- Đăng nhập, tải 1 ảnh bìa + 1 bài nhạc nhỏ → phải thành công.
- Phát nhạc, mở bài viết có ảnh → hiển thị bình thường.
- F12 → Console: không có lỗi đỏ "Content Security Policy".
Nếu tải lên báo lỗi R2 (mã 403) → gửi Copilot ảnh chụp lỗi.

## Bước 5. Đưa lên mạng
npm run build → git add . ; git commit -m "v0.15 bao mat" ; git push
