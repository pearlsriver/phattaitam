"use client";

import { useRef, useState } from "react";
import RichEditor from "@/components/posts/RichEditor";
import { MAX_UPLOAD_MB } from "@/lib/supabase";
import { removeFiles } from "@/services/storage";
import { CATEGORIES, CATEGORY_KEYS, type Category, type Post, type PostInput } from "@/types/post";
import { isHtml, stripHtml, textToHtml } from "@/utils/html";
import { difference, imagePathFromUrl, imagePathsInHtml } from "@/utils/storagePaths";

/** Form dùng chung cho Viết bài mới và Sửa bài */
export default function PostForm({
  post,
  defaultCategory = "van",
  submitLabel,
  onSubmit,
  onCancel,
}: {
  post?: Post | null;
  defaultCategory?: Category;
  submitLabel: string;
  onSubmit: (input: PostInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const initialHtml = post ? (isHtml(post.content) ? post.content : textToHtml(post.content)) : "";
  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState<Category>(post?.category ?? defaultCategory);
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(initialHtml);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ảnh tải lên trong lần soạn này (chưa lưu) */
  const sessionUploads = useRef<string[]>([]);

  const hasText = stripHtml(content).length > 0 || /<img/i.test(content);
  const hasFileAfter = !!newFile || (!!post?.file_path && !removeFile);

  /** Xoá các ảnh vừa tải lên nhưng không nằm trong nội dung cuối cùng */
  async function cleanupSession(finalHtml: string) {
    const uploaded = sessionUploads.current.map((u) => imagePathFromUrl(u)).filter((p): p is string => !!p);
    const unused = difference(uploaded, imagePathsInHtml(finalHtml));
    sessionUploads.current = [];
    if (unused.length) await removeFiles("images", unused);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasText && !hasFileAfter) return setError("Hãy viết nội dung hoặc đính kèm một tệp.");
    if (newFile && newFile.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Tệp vượt quá ${MAX_UPLOAD_MB} MB.`);
    setBusy(true);
    setError(null);
    const finalContent = hasText ? content : "";
    try {
      await onSubmit({ title, category, excerpt, content: finalContent, newFile, removeFile });
      await cleanupSession(finalContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được bài viết");
      setBusy(false);
    }
  }

  async function cancel() {
    // Huỷ: bỏ mọi ảnh mới tải lên trong lần soạn này (nội dung đã lưu giữ nguyên)
    await cleanupSession(post?.content ?? "");
    onCancel?.();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" className="field font-serif text-xl" />
      <div className="flex flex-wrap gap-2">
        {CATEGORY_KEYS.map((k) => (
          <button key={k} type="button" onClick={() => setCategory(k)}
            className={`rounded-full px-4 py-1.5 text-sm ${category === k ? "bg-ink text-paper" : "border border-line text-ink-soft hover:bg-soft"}`}>
            {CATEGORIES[k].label}
          </button>
        ))}
      </div>
      <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Tóm tắt ngắn — hiện khi chia sẻ link (không bắt buộc)" className="field" />

      <RichEditor
        initialHtml={initialHtml}
        onChange={setContent}
        onImageUploaded={(url) => sessionUploads.current.push(url)}
        placeholder="Viết nội dung… (ảnh đầu tiên sẽ làm ảnh đại diện khi chia sẻ)"
      />

      <div className="space-y-3 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-soft">
        <p className="font-medium text-ink">📎 Đính kèm sách / tài liệu (PDF, EPUB, DOCX, TXT — tối đa {MAX_UPLOAD_MB} MB)</p>
        {post?.file_path && !newFile && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={removeFile} onChange={(e) => setRemoveFile(e.target.checked)} />
            <span className={removeFile ? "line-through" : ""}>Hiện tại: {post.file_name}</span>
            <span className="text-red-600">— xoá tệp này</span>
          </label>
        )}
        <input type="file" accept=".pdf,.epub,.doc,.docx,.txt"
          onChange={(e) => { setNewFile(e.target.files?.[0] ?? null); setRemoveFile(false); }} />
      </div>

      {error && <p className="text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy} className="rounded-full bg-ink px-7 py-3 font-medium text-paper hover:opacity-90 disabled:opacity-50">
          {busy ? "Đang lưu…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={cancel} className="rounded-full border border-line px-6 py-3 text-ink-soft hover:bg-soft">Huỷ</button>
        )}
      </div>
    </form>
  );
}
