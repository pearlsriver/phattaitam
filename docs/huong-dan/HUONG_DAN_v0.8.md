# Phật Tại Tâm v0.8 — Ảnh bìa vừa khung, tự nén ~1 MB, tải ảnh bìa

Không cần chạy SQL. Không cần đổi biến môi trường.

1. Giải nén đè lên D:\GitHub\phattaitam (chọn Replace).
2. Remove-Item -Recurse -Force .next ; npm run dev
3. npm run build -> thành công thì:  git add . ; git commit -m "v0.8 cover fit compress download" ; git push

Ghi chú: ảnh bìa ĐÃ tải lên trước đây (3 ảnh ~6,7 MB) không bị nén lại; chúng chỉ được hiển thị vừa khung.
Muốn nén: Sửa album / bài hát -> chọn lại ảnh bìa.
