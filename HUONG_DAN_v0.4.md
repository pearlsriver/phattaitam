# Phật Tại Tâm v0.4 — Sửa bài viết, sửa nhạc, ngày giờ đăng/sửa

## 1. Cập nhật database (BẮT BUỘC, làm trước)
Supabase → SQL Editor → mở file supabase\migration_v4_edit.sql trong VS Code,
Ctrl+A, Ctrl+C → dán vào SQL Editor → Run → thấy "Success".

## 2. Chép code
Giải nén đè lên D:\GitHub\phattaitam (chọn Replace). Chỉ thay/thêm các file trong zip.

## 3. Chạy lại
Ctrl+C →  Remove-Item -Recurse -Force .next; npm run dev

## Tính năng mới
- /sua-bai/[id]  : sửa tiêu đề, mục, tóm tắt, nội dung; thay hoặc xoá tệp đính kèm.
- /sua-nhac/[id] : sửa tên, ca sĩ, album; thay tệp nhạc; thay hoặc xoá ảnh bìa.
- Nút ✏️ Sửa ở: trang Tài khoản, trang Quản trị, trang bài viết, thẻ bài hát.
- Hiển thị "Đăng / Tải lên lúc …" và "Sửa lần cuối …" (giờ:phút ngày/tháng/năm).
- Duyệt/ẩn bài KHÔNG tính là "sửa". Người dùng thường sửa bài đã đăng → về "Chờ duyệt".
- Khi thay tệp, tệp cũ trên Storage được xoá tự động.
