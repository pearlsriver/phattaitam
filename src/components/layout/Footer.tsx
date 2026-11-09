import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line py-10 text-center text-sm text-muted">
      <p className="font-serif text-base text-ink-soft">Phật Tại Tâm — Thư Viện Số</p>
      <p className="mt-1">Phụng sự Phật pháp – Lan tỏa yêu thương – Chia sẻ vô cầu</p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/dieu-le" className="text-accent hover:underline">Điều lệ tham gia &amp; chia sẻ nội dung</Link>
        <span>© {new Date().getFullYear()} phattaitam.com</span>
      </p>
    </footer>
  );
}
