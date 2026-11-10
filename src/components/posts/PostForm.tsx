"use client";

import { useRef, useState } from "react";
import CoverPicker from "@/components/posts/CoverPicker";
import RichEditor from "@/components/posts/RichEditor";
import TagInput from "@/components/ui/TagInput";
import { useAuth } from "@/hooks/useAuth";
import { MAX_UPLOAD_MB } from "@/lib/supabase";
import { removeFiles } from "@/services/storage";
import { customCover, type Post, type PostInput } from "@/types/post";
import { isHtml, stripHtml, textToHtml } from "@/utils/html";
import { difference, imagePathFromUrl, imagePathsInHtml } from "@/utils/storagePaths";

/** Form dùng chung cho Viết bài mới và Sửa bài */
export default function PostForm({
  post,
  defaultTags = [],
  submitLabel,
  onSubmit,
  onCancel,
}: {
  post?: Post | null;
  defaultTags?: string[];
  submitLabel: string;
  onSubmit: (input: PostInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const { profile } = useAuth();
  const initialHtml = post ? (isHtml(post.content) ? post.content : textToHtml(post.content)) : "";
  const [title, setTitle] = useState(post?.title ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? defaultTags);
  const [authorName, setAuthorName] = useState(post ? (post.author_name ?? post.author?.full_name ?? "") : (profile?.full_name ?? ""));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [cover, setCover] = useState<string | null>(post ? customCover(post) : null);
  const [content, setContent] = useState(initialHtml);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ảnh tải lên trong lần soạn này (chưa lưu) */
  const sessionUploads = useRef<string[]>([]);

  const hasText = stripHtml(content).length > 0 || /<img/i.test(content);
  const hasFileAfter = !!newFile || (!!post?.file_path && !removeFile);

  /** Xoá các ảnh vừa tải lên nhưng cuối cùng không dùng (không nằm trong nội dung, không phải ảnh bìa) */
  async function cleanupSession(keepHtml: string, keepCover: string | null) {
    const uploaded = (sessionUploads.current ?? []).map((u) => imagePathFromUrl(u)).filter((p): p is string => !!p);
    const keep = imagePathsInHtml(keepHtml);
    const c = imagePathFromUrl(keepCover);
    if (c) keep.push(c);
    const unused = difference(uploaded, keep);
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
      await onSubmit({ title, tags, authorName, excerpt, content: finalContent, coverImage: cover, newFile, removeFile });
      await cleanupSession(finalContent, cover);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được bài viết");
      setBusy(false);
    }
  }

  async function cancel() {
    await cleanupSession(post?.content ?? "", post?.cover_image ?? null);
    onCancel?.();
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Ảnh bìa bên trái, thông tin bên phải (điện thoại: xếp chồng) */}
      <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
        <div className="mx-auto w-40 sm:mx-0 sm:w-auto">
          <CoverPicker value={cover} onChange={setCover} onUploaded={(url) => sessionUploads.current?.push(url)} />
        </div>
        <div className="min-w-0 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Tiêu đề</span>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề bài viết / tên sách" className="field font-serif text-lg sm:text-xl" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink">Tác giả</span>
            <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={120}
              placeholder="Tên tác giả của tác phẩm" className="field" />
            <span className="mt-1 block text-xs text-muted">Có thể khác người đăng (dịch giả, tác giả kinh sách…). Để trống sẽ dùng tên của bạn.</span>
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium text-ink">Hashtag</span>
            <TagInput value={tags} onChange={setTags} />
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Tóm tắt</span>
        <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Hiện khi chia sẻ link (không bắt buộc)" className="field" />
      </label>

      <RichEditor
        initialHtml={initialHtml}
        onChange={setContent}
        onImageUploaded={(url) => sessionUploads.current?.push(url)}
        placeholder="Viết nội dung…"
      />

      <div className="space-y-3 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-soft">
        <p className="font-medium text-ink">📎 Đính kèm sách / tài liệu</p>
        <p className="-mt-2 text-xs text-muted">PDF, EPUB, DOCX, TXT — tối đa {MAX_UPLOAD_MB} MB</p>
        {post?.file_path && !newFile && (
          <label className="flex flex-wrap items-center gap-2">
            <input type="checkbox" checked={removeFile} onChange={(e) => setRemoveFile(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            <span className={`break-all ${removeFile ? "line-through" : ""}`}>Hiện tại: {post.file_name}</span>
            <span className="text-red-500">— xoá tệp này</span>
          </label>
        )}
        <input type="file" accept=".pdf,.epub,.doc,.docx,.txt" className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-accent"
          onChange={(e) => { setNewFile(e.target.files?.[0] ?? null); setRemoveFile(false); }} />
      </div>

      {error && <p className="text-red-500">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && <button type="button" onClick={cancel} className="btn btn-secondary !py-3">Huỷ</button>}
        <button disabled={busy} className="btn btn-primary !px-7 !py-3 sm:order-first">{busy ? "Đang lưu…" : submitLabel}</button>
      </div>
    </form>
  );
}
