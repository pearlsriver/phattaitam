"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage } from "@/services/storage";
import { sanitizeHtml } from "@/utils/html";

/**
 * Trình soạn thảo: đậm, nghiêng, gạch chân, tiêu đề, trích dẫn, danh sách,
 * liên kết, chèn ảnh (tải lên Supabase). Lưu nội dung dạng HTML.
 */
export default function RichEditor({
  initialHtml,
  onChange,
  onImageUploaded,
  placeholder = "Viết nội dung…",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  /** Báo cho form biết ảnh vừa tải lên (để dọn nếu cuối cùng không dùng tới) */
  onImageUploaded?: (url: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current && !ref.current.dataset.ready) {
      ref.current.innerHTML = sanitizeHtml(initialHtml);
      ref.current.dataset.ready = "1";
    }
  }, [initialHtml]);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  function exec(cmd: string, value?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, value);
    emit();
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0);
  }

  function restoreSelection() {
    ref.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  }

  function addLink() {
    saveSelection();
    const url = prompt("Nhập địa chỉ liên kết (https://…):", "https://");
    if (!url || url === "https://") return;
    restoreSelection();
    exec("createLink", url);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, user.id, "post-");
      onImageUploaded?.(url);
      restoreSelection();
      exec("insertHTML", `<p><img src="${url}" alt=""></p><p><br></p>`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được ảnh");
    } finally {
      setUploading(false);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const html = e.clipboardData.getData("text/html");
    if (html) {
      e.preventDefault();
      exec("insertHTML", sanitizeHtml(html));
    }
  }

  const btn = "min-w-9 rounded-lg px-2 py-1.5 text-sm text-ink-soft hover:bg-soft";
  const sep = <span className="mx-1 h-6 w-px bg-line" />;
  const B = (label: React.ReactNode, title: string, action: () => void) => (
    <button type="button" title={title} aria-label={title} className={btn}
      onMouseDown={(e) => { e.preventDefault(); action(); }}>
      {label}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-surface/95 p-1.5 backdrop-blur">
        {B(<b>B</b>, "Chữ đậm (Ctrl+B)", () => exec("bold"))}
        {B(<i>I</i>, "Chữ nghiêng (Ctrl+I)", () => exec("italic"))}
        {B(<u>U</u>, "Gạch chân (Ctrl+U)", () => exec("underline"))}
        {B(<s>S</s>, "Gạch ngang", () => exec("strikeThrough"))}
        {sep}
        {B("H2", "Tiêu đề lớn", () => exec("formatBlock", "<h2>"))}
        {B("H3", "Tiêu đề nhỏ", () => exec("formatBlock", "<h3>"))}
        {B("¶", "Đoạn văn thường", () => exec("formatBlock", "<p>"))}
        {B("❝", "Trích dẫn", () => exec("formatBlock", "<blockquote>"))}
        {sep}
        {B("• —", "Danh sách chấm", () => exec("insertUnorderedList"))}
        {B("1.", "Danh sách số", () => exec("insertOrderedList"))}
        {B("⎯", "Đường kẻ ngang", () => exec("insertHorizontalRule"))}
        {sep}
        {B("🔗", "Chèn liên kết", addLink)}
        {B(uploading ? "…" : "🖼", "Chèn ảnh", () => { saveSelection(); fileRef.current?.click(); })}
        {sep}
        {B("↶", "Hoàn tác (Ctrl+Z)", () => exec("undo"))}
        {B("↷", "Làm lại (Ctrl+Y)", () => exec("redo"))}
        {B("⨯", "Xoá định dạng", () => exec("removeFormat"))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={() => { saveSelection(); emit(); }}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={onPaste}
        className="rich-content rich-editor min-h-[22rem] px-5 py-4 outline-none"
      />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
      {error && <p className="border-t border-line px-4 py-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
