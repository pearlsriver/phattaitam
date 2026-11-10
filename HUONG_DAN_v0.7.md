# Phật Tại Tâm v0.7 — Giao diện điện thoại, ảnh bìa màn hình khoá, sửa trình soạn thảo, ảnh bìa bài viết

Không cần chạy SQL (cột cover_image đã có sẵn).

1. Giải nén đè lên D:\GitHub\phattaitam (chọn Replace).
2. Remove-Item -Recurse -Force .next ; npm run dev
3. Thử trên điện thoại cùng mạng Wi-Fi: chạy  npm run dev -- -H 0.0.0.0
   rồi mở http://<IP-máy-tính>:3000 trên điện thoại (xem IP bằng lệnh ipconfig).
   (Màn hình khoá chỉ hiện ảnh bìa đầy đủ trên bản HTTPS — kiểm tra kỹ trên phattaitam.com.)
4. npm run build  → nếu thành công:
   git add . ; git commit -m "v0.7 mobile UI, lock screen artwork, editor, cover" ; git push
