# Phật Tại Tâm v0.18 — Quản lý tệp cho Super Admin
Không cần chạy SQL, không cần đổi biến môi trường.
1. Giải nén đè lên D:\GitHub\phattaitam (Replace) — chỉ THÊM 2 tệp mới, không ghi đè tệp cũ.
2. Thêm nút vào trang Quản trị: mở src\app\admin\page.tsx, tìm dòng
     <Link href="/admin/don-dep" className="btn btn-secondary">🧹 Dọn dẹp kho lưu trữ</Link>
   thêm NGAY TRƯỚC dòng đó:
     <Link href="/admin/tep" className="btn btn-secondary">📁 Quản lý tệp</Link>
3. npm run dev → đăng nhập Super Admin → http://localhost:3000/admin/tep
4. npm run build → git add . ; git commit -m "v0.18 quan ly tep" ; git push
