# Phật Tại Tâm v0.11 — Gói A + B

## 1. Chạy SQL (bắt buộc, làm trước)
Supabase → SQL Editor → mở supabase\migration_v10_roles_settings.sql → Ctrl+A, Ctrl+C → dán → Run.
Kết quả cuối liệt kê số thành viên theo cấp. Phải có dòng  super_admin | 1  (tài khoản admin cũ của bạn).
Nếu không có, chạy lệnh ở cuối file SQL (đổi email).

## 2. Chép code
Giải nén đè lên D:\GitHub\phattaitam (Replace).
Remove-Item -Recurse -Force .next ; npm run dev
Đăng xuất rồi đăng nhập lại để nhận cấp mới.

## 3. Việc nên làm ngay
- Quản trị → Nhạc → "⏱ Đo thời lượng" để đo các bài hát cũ.
- Quản trị → 👥 Thành viên: nâng các thành viên nòng cốt lên VIP.
- Bấm "✏️ Chỉnh sửa trang" (Super Admin) để thử sửa chữ, menu, logo → Lưu.

## 4. Đưa lên mạng
npm run build → git add . ; git commit -m "v0.11 roles, members, edit mode" ; git push
