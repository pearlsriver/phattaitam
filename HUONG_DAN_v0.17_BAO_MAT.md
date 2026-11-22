# Phật Tại Tâm v0.17 — Vá bảo mật đợt 2 (4 bước)

1. SQL: Supabase → SQL Editor → chạy supabase\migration_v14_security2.sql
   Kết quả cuối: 4 dòng (albums, comments, posts, songs).
2. Code: giải nén đè lên D:\GitHub\phattaitam (Replace) → npm run build
3. Supabase → Authentication → Sign In / Providers → Email:
   Minimum password length = 8 (bật "Leaked password protection" nếu có).
4. Cloudflare → phattaitam.com → Rules → Transform Rules → Modify Response Header → Create:
   - When: Hostname equals media.phattaitam.com
   - Set static: X-Content-Type-Options = nosniff
   Deploy.
Sau đó: git add . ; git commit -m "v0.17 bao mat" ; git push
