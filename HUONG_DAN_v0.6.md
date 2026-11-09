# Phật Tại Tâm v0.6

Logo mới · menu Thư Viện / Sách / Nhạc · giao diện tối mặc định · nút bấm thống nhất ·
trình phát nhạc kiểu kính mờ (lặp lại, hàng đợi, menu ⋯ → "Hiển thị lời bài hát") ·
hashtag + "Tác giả" thay cho chuyên mục · quản lý Radio · Điều lệ bắt buộc · chuyển media sang Cloudflare R2.

## A. Cập nhật database (làm trước)
Supabase → SQL Editor → mở supabase\migration_v6.sql → Ctrl+A, Ctrl+C → dán → Run → "Success".
(Chuyên mục cũ Văn/Thơ/Kinh Phật/Thiền tự chuyển thành hashtag #văn #thơ #kinh-phật #thiền.)

## B. Tạo kho lưu trữ Cloudflare R2
1. dash.cloudflare.com → R2 Object Storage → (đăng ký R2 nếu được hỏi; cần thẻ thanh toán nhưng gói miễn phí 10 GB) →
   Create bucket → tên: phattaitam-media
2. Bucket → Settings → Custom Domains → Add → media.phattaitam.com → Connect (Cloudflare tự tạo DNS).
3. Bucket → Settings → CORS Policy → Add → dán:
   [
     {
       "AllowedOrigins": ["https://www.phattaitam.com", "https://phattaitam.com", "http://localhost:3000"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
4. R2 → Manage API Tokens → Create API token → Permission: "Object Read & Write" → chọn bucket phattaitam-media → Create.
   Copy: Access Key ID, Secret Access Key (chỉ hiện 1 lần). Account ID nằm ở trang R2 (bên phải).

## C. Điền biến môi trường
Copy .env.local.example thành .env.local (hoặc thêm vào .env.local hiện có) và điền:
NEXT_PUBLIC_MEDIA_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
Vercel → Settings → Environment Variables → thêm đúng 5 biến đó (Production + Preview + Development).

## D. Chép code
1. Giải nén zip đè lên D:\GitHub\phattaitam (Replace). Zip chứa cả public\logo.png và các biểu tượng mới.
2. Xoá (nếu còn) src\components\layout\Navbar.tsx
3. Terminal:  Remove-Item -Recurse -Force .next ; npm run dev

## E. Chuyển tệp cũ từ Supabase sang R2
Mở PowerShell tại D:\GitHub\phattaitam:
  $env:SUPABASE_SERVICE_ROLE_KEY = "dán khoá secret/service_role của Supabase"   # Project Settings > API
  node scripts/migrate-supabase-to-r2.mjs --dry-run     # xem trước
  node scripts/migrate-supabase-to-r2.mjs               # chép sang R2 (chưa xoá gì)
Mở website, kiểm tra nhạc/ảnh/sách đều hiện và phát được. Rồi:
  supabase\after_r2_migration.sql  → chạy trong SQL Editor (đổi địa chỉ ảnh trong bài viết & ảnh đại diện)
Khi chắc chắn mọi thứ ổn (nên đợi vài ngày):
  node scripts/migrate-supabase-to-r2.mjs --delete      # xoá bản gốc trên Supabase để giải phóng dung lượng
Khoá service_role chỉ dùng tạm ở máy bạn — KHÔNG đưa vào .env.local đẩy lên GitHub, KHÔNG đưa vào Vercel.

## F. Đưa lên mạng
  npm run build
  git add . ; git status --short | Select-String "env"     # chỉ được thấy .env.local.example
  git commit -m "v0.6" ; git push
Vercel tự build. Sau khi Ready, vào Quản trị → Dọn dẹp để quét kho R2.

## Ghi chú
- Chưa đặt NEXT_PUBLIC_MEDIA_URL thì website vẫn chạy bằng Supabase Storage như cũ (có thể cập nhật code trước, chuyển media sau).
- NEXT_PUBLIC_* được nhúng lúc build: đổi giá trị trên Vercel phải Redeploy.
- Radio: Quản trị → 📻 Quản lý Radio.
- Điều lệ: /dieu-le. Tài khoản chưa đồng ý (kể cả tài khoản cũ) sẽ thấy cửa sổ bắt buộc khi đăng nhập.
- Hashtag: gõ rồi Enter / dấu phẩy / dấu cách. Muốn hashtag nhiều từ, nối bằng gạch ngang: kinh-phật.
