import type { Metadata } from "next";
import PostBrowser from "@/components/posts/PostBrowser";

export const metadata: Metadata = {
  title: "Sách",
  description: "Sách và tài liệu Phật học dạng PDF, EPUB, DOCX — đọc online hoặc tải về.",
  alternates: { canonical: "/sach" },
};

export default function BooksPage() {
  return (
    <PostBrowser
      mode="books"
      eyebrow="Sách"
      title="Sách & tài liệu"
      subtitle="Những tác phẩm có tệp đính kèm (PDF, EPUB, DOCX…) — đọc online hoặc tải về."
    />
  );
}
