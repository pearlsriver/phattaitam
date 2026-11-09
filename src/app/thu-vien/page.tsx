import type { Metadata } from "next";
import PostBrowser from "@/components/posts/PostBrowser";

export const metadata: Metadata = {
  title: "Thư Viện",
  description: "Kho bài viết, văn thơ, kinh điển và suy niệm — lọc theo hashtag, đọc online hoặc tải về.",
  alternates: { canonical: "/thu-vien" },
};

export default function LibraryPage() {
  return (
    <PostBrowser
      mode="all"
      eyebrow="Thư viện"
      title="Khám phá thư viện"
      subtitle="Bài viết, văn thơ, kinh điển và suy niệm — lọc theo hashtag để tìm điều bạn cần."
    />
  );
}
