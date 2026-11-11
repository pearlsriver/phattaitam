"use client";

import Link from "next/link";
import { EditableText } from "@/components/site/Editable";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line py-10 text-center text-sm text-muted">
      <EditableText as="p" k="footer.title" label="Chân trang — tiêu đề" className="font-serif text-base text-ink-soft" />
      <EditableText as="p" k="footer.motto" label="Chân trang — khẩu hiệu" className="mt-1" />
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/dieu-le" className="text-accent hover:underline">
          <EditableText k="footer.termsLabel" label="Chân trang — liên kết Điều lệ" />
        </Link>
        <span>© {new Date().getFullYear()} <EditableText k="footer.copyright" label="Chân trang — bản quyền" /></span>
      </p>
    </footer>
  );
}
