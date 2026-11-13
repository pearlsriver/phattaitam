# Phật Tại Tâm v0.2 — Hướng dẫn cài đặt

## 1. Chép code vào dự án
1. XOÁ thư mục `app/` ở gốc dự án (D:\GitHub\phattaitam\app) — Next.js sẽ bỏ qua `src/app` nếu `app/` ở gốc còn tồn tại.
2. Giải nén zip này đè lên D:\GitHub\phattaitam (ghi đè `package.json`, `tsconfig.json`, toàn bộ `src/`).
3. Terminal (PowerShell):  `npm install`

## 2. Tạo Supabase
1. https://supabase.com → New project.
2. SQL Editor → dán toàn bộ `supabase/schema.sql` → Run.
3. Project Settings → API: copy Project URL + anon/publishable key.
4. Đổi tên `.env.local.example` → `.env.local`, điền 2 giá trị đó.

## 3. Bật đăng nhập
- Email: Authentication → Sign In / Providers → Email (mặc định đã bật).
- Google:
  1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application).
  2. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
  3. Dán Client ID + Secret vào Supabase → Authentication → Providers → Google.
- Authentication → URL Configuration:
  - Site URL: `https://www.phattaitam.com`
  - Redirect URLs: `http://localhost:3000/**` và `https://www.phattaitam.com/**`

## 4. Chạy thử
`npm run dev` → http://localhost:3000 → đăng nhập lần đầu.
Sau đó vào SQL Editor chạy lệnh (đổi email):
```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'email-cua-ban@gmail.com');
```
Đăng xuất / đăng nhập lại → thấy nút "Quản trị".

## 5. Đưa lên mạng (Vercel)
GitHub Pages KHÔNG chạy được bản này nếu dùng server; nên dùng Vercel (miễn phí):
1. vercel.com → Import repo `pearlsriver/phattaitam`.
2. Thêm 2 biến môi trường như `.env.local`.
3. Deploy → Settings → Domains → thêm `phattaitam.com` và `www.phattaitam.com`, cập nhật DNS ở Cloudflare theo hướng dẫn của Vercel.

## Cấu trúc
- `/` trang chủ · `/van` `/tho` `/kinh-phat` `/thien` · `/bai-viet/[slug]`
- `/nhac` thư viện nhạc + Radio · `/viet-bai` · `/tai-nhac`
- `/login` · `/dashboard` · `/admin`
- Người dùng gửi bài/nhạc → chờ duyệt; admin đăng trực tiếp và duyệt.
- Giới hạn tệp: 50 MB/tệp (gói Supabase Free).
