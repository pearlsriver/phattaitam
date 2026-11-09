export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line py-10 text-center text-sm text-muted">
      <p className="font-serif text-base text-ink-soft">Phật Tại Tâm — Thư Viện Số</p>
      <p className="mt-1">Thư viện số, nơi xuất bản cộng đồng và không gian âm nhạc.</p>
      <p className="mt-3">© {new Date().getFullYear()} phattaitam.com</p>
    </footer>
  );
}
