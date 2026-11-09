"use client";

import { useEffect, useState } from "react";
import { isHtml, sanitizeHtml } from "@/utils/html";

/** Hiển thị nội dung bài viết: HTML đã lọc an toàn, hoặc văn bản thuần (bài cũ) */
export default function RichContent({ content }: { content: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const htmlMode = isHtml(content);

  useEffect(() => {
    if (htmlMode) setHtml(sanitizeHtml(content));
  }, [content, htmlMode]);

  if (!htmlMode) {
    return <div className="whitespace-pre-wrap font-serif text-lg leading-loose text-ink">{content}</div>;
  }
  if (html === null) return null;
  return <div className="rich-content" dangerouslySetInnerHTML={{ __html: html }} />;
}
