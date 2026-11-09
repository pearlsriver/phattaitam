# Phật Tại Tâm v0.5 — Album, playlist, lời bài hát, trình soạn thảo,
# hồ sơ, yêu thích, bình luận, lượt nghe/đọc, SEO & chia sẻ

## 1. Cập nhật database (BẮT BUỘC, làm trước)
Supabase → SQL Editor → mở supabase\migration_v5_features.sql trong VS Code
→ Ctrl+A, Ctrl+C → dán → Run → "Success".
(Không chạy lại schema.sql và migration_v4_edit.sql.)
Tên album cũ (dạng chữ) sẽ tự chuyển thành album thật.

## 2. Thay code
1. XOÁ thư mục D:\GitHub\phattaitam\src  (bản mới thay toàn bộ, tránh file cũ thừa)
2. Giải nén zip đè lên D:\GitHub\phattaitam (chọn Replace).
3. Thêm dòng sau vào .env.local:
   NEXT_PUBLIC_SITE_URL=https://www.phattaitam.com
4. PowerShell:  Remove-Item -Recurse -Force .next; npm run dev

## 3. Vercel
Settings → Environment Variables → thêm NEXT_PUBLIC_SITE_URL = https://www.phattaitam.com
Sau đó: git add . ; git commit -m "v0.5" ; git push

## Trang mới
/album, /album/[id], /album/moi, /album/sua/[id]   Album + radio theo album
/bai-hat/[id]                                     Trang bài hát: lời, ♥, bình luận
/playlist, /playlist/[id]                         Playlist cá nhân (công khai/riêng tư)
/ho-so                                            Sửa tên, ảnh đại diện, giới thiệu
/tac-gia/[id]                                     Trang tác giả
/sitemap.xml, /robots.txt, /og                    SEO + ảnh chia sẻ mặc định

## Kiểm tra ảnh khi chia sẻ Facebook
https://developers.facebook.com/tools/debug/ → dán link bài → "Scrape Again".
Zalo lưu bộ nhớ đệm lâu hơn; link mới chia sẻ lần đầu sẽ hiện đúng.
