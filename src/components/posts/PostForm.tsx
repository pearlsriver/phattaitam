"use client";

import { useRef, useState } from "react";
import CoverPicker from "@/components/posts/CoverPicker";
import RichEditor from "@/components/posts/RichEditor";
import FileDrop from "@/components/ui/FileDrop";
import TagInput from "@/components/ui/TagInput";
import VisibilityPicker from "@/components/ui/VisibilityPicker";
import { useAuth } from "@/hooks/useAuth";
import { MAX_UPLOAD_MB } from "@/lib/supabase";
import type { Visibility } from "@/lib/visibility";
import { removeFiles } from "@/services/storage";
import { customCover, type Post, type PostInput } from "@/types/post";
import { isHtml, stripHtml, textToHtml } from "@/utils/html";
import { difference, imagePathFromUrl, imagePathsInHtml } from "@/utils/storagePaths";

const BOOK_ACCEPT = ".pdf,.epub,.doc,.docx,.txt";

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
  const { profile, canPublish } = useAuth();
  const initialHtml = post ? (isHtml(post.content) ? post.content : textToHtml(post.content)) : "";
  const [title, setTitle] = useState(post?.title ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? defaultTags);
  const [authorName, setAuthorName] = useState(post ? (post.author_name ?? post.author?.full_name ?? "") : (profile?.full_name ?? ""));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [cover, setCover] = useState<string | null>(post ? customCover(post) : null);
  const [visibility, setVisibility] = useState<Visibility>(post?.visibility ?? "public");
  const [content, setContent] = useState(initialHtml);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ảnh tải lên trong lần soạn này (chưa lưu) */
  const sessionUploads = useRef<string[]>([]);

  const hasText = stripHtml(content).length > 0 || /<img/i.test(content);
  const hasFileAfter = !!newFile || (!!post?.file_path && !removeFile);

  async function cleanupSession(keepHtml: string, keepCover: string | null) {
    const uploaded = (sessionUploads.current ?? []).map((u) => imagePathFromUrl(u)).filter((p): p is string => !!p);
    const keep = imagePathsInHtml(keepHtml);
    const c = imagePathFromUrl(keepCover);
    if (c) keep.push(c);
    const unused = difference(uploaded, keep);
    sessionUploads.current = [];
    if (unused.length) await removeFiles("images", unused);
  }

  function pickFile(f: File | null) {
    if (f && f.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Tệp vượt quá ${MAX_UPLOAD_MB} MB.`);
    setError(null);
    setNewFile(f);
    if (f) setRemoveFile(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasText && !hasFileAfter) return setError("Hãy viết nội dung hoặc đính kèm một tệp.");
    if (newFile && newFile.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(`Tệp vượt quá ${MAX_UPLOAD_MB} MB.`);
    setBusy(true);
    setError(null);
    const finalContent = hasText ? content : "";
    try {
      await onSubmit({ title, tags, authorName, excerpt, content: finalContent, coverImage: cover, visibility, newFile, removeFile });
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

      <VisibilityPicker value={visibility} onChange={setVisibility} needsApproval={!canPublish} />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Tóm tắt</span>
        <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Hiện khi chia sẻ link (không bắt buộc)" className="field" />
      </label>

      <RichEditor
        initialHtml={initialHtml}
        onChange={setContent}
        onImageUploaded={(url) => sessionUploads.current?.push(url)}
        placeholder="Viết nội dung… (có thể kéo-thả ảnh vào đây)"
      />

      <FileDrop
        accept={BOOK_ACCEPT}
        title="📎 Đính kèm sách / tài liệu"
        hint={`PDF, EPUB, DOCX, TXT — tối đa ${MAX_UPLOAD_MB} MB`}
        file={newFile}
        onFile={pickFile}
        onReject={setError}
      >
        {post?.file_path && !newFile && (
          <label className="mt-3 flex flex-wrap items-center gap-2">
            <input type="checkbox" checked={removeFile} onChange={(e) => setRemoveFile(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            <span className={`break-all ${removeFile ? "line-through" : ""}`}>Hiện tại: {post.file_name}</span>
            <span className="text-red-500">— xoá tệp này</span>
          </label>
        )}
      </FileDrop>

      {error && <p className="text-red-500">{error}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        {onCancel && <button type="button" onClick={cancel} className="btn btn-secondary !py-3">Huỷ</button>}
        <button disabled={busy} className="btn btn-primary !px-7 !py-3 sm:order-first">{busy ? "Đang lưu…" : submitLabel}</button>
      </div>
    </form>
  );
}
