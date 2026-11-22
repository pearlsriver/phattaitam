"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage } from "@/services/storage";
import { sanitizeHtml } from "@/utils/html";

/**
 * Trình soạn thảo: đậm, nghiêng, gạch chân, tiêu đề, trích dẫn, danh sách, liên kết, chèn ảnh.
 * Có thể KÉO-THẢ ảnh từ máy tính thẳng vào nội dung (ảnh được chèn đúng chỗ thả).
 */
export default function RichEditor({
  initialHtml,
  onChange,
  onImageUploaded,
  placeholder = "Viết nội dung…",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  onImageUploaded?: (url: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const dragDepth = useRef(0);
  const { user } = useAuth();
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current && !ref.current.dataset.ready) {
      ref.current.innerHTML = sanitizeHtml(initialHtml);
      ref.current.dataset.ready = "1";
    }
  }, [initialHtml]);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  function exec(cmd: string, value?: string) {
    restoreSelection();
    document.execCommand(cmd, false, value);
    saveSelection();
    emit();
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0);
  }

  function restoreSelection() {
    ref.current?.focus({ preventScroll: true });
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
    exec("createLink", url);
  }

  /** Tải ảnh lên rồi chèn vào vị trí con trỏ đã lưu */
  async function insertImages(files: File[]) {
    if (!user) return;
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return setError("Chỉ kéo-thả được tệp ảnh vào nội dung. Sách/tài liệu hãy thả vào ô “Đính kèm”.");
    setError(null);
    for (const f of imgs.slice(0, 10)) {
      setUploading((n) => n + 1);
      try {
        const url = await uploadImage(f, user.id, "post-");
        onImageUploaded?.(url);
        exec("insertHTML", `<p><img src="${url}" alt=""></p><p><br></p>`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được ảnh");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    await insertImages(files);
  }

  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    if (!hasFiles(e)) return; // kéo chữ trong trình soạn thảo: để trình duyệt xử lý
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    // Đặt con trỏ tại đúng điểm thả
    const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null; caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
    let range: Range | null = null;
    if (doc.caretRangeFromPoint) range = doc.caretRangeFromPoint(e.clientX, e.clientY);
    else if (doc.caretPositionFromPoint) {
      const p = doc.caretPositionFromPoint(e.clientX, e.clientY);
      if (p) { range = document.createRange(); range.setStart(p.offsetNode, p.offset); range.collapse(true); }
    }
    if (range && ref.current?.contains(range.startContainer)) savedRange.current = range;
    insertImages(Array.from(e.dataTransfer.files));
  }

  function onPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(e.clipboardData.files ?? []).filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      e.preventDefault();
      saveSelection();
      insertImages(files);
      return;
    }
    const html = e.clipboardData.getData("text/html");
    if (html) {
      e.preventDefault();
      exec("insertHTML", sanitizeHtml(html));
    }
  }

  const btn = "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm text-ink-soft transition hover:bg-soft hover:text-ink active:scale-95";
  const sep = <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />;
  const B = (label: React.ReactNode, title: string, action: () => void) => (
    <button type="button" title={title} aria-label={title} className={btn} onMouseDown={(e) => e.preventDefault()} onClick={action}>
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink">Nội dung</span>

      <div role="toolbar" aria-label="Định dạng văn bản"
        className="no-scrollbar flex flex-nowrap items-center gap-0.5 overflow-x-auto rounded-xl border border-line bg-soft/60 p-1 sm:flex-wrap">
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
        {B("•", "Danh sách chấm", () => exec("insertUnorderedList"))}
        {B("1.", "Danh sách số", () => exec("insertOrderedList"))}
        {B("—", "Đường kẻ ngang", () => exec("insertHorizontalRule"))}
        {sep}
        {B("🔗", "Chèn liên kết", addLink)}
        {B(uploading ? "…" : "🖼", "Chèn ảnh (hoặc kéo-thả ảnh vào nội dung)", () => { saveSelection(); fileRef.current?.click(); })}
        {sep}
        {B("↶", "Hoàn tác (Ctrl+Z)", () => exec("undo"))}
        {B("↷", "Làm lại (Ctrl+Y)", () => exec("redo"))}
        {B("⨯", "Xoá định dạng", () => exec("removeFormat"))}
      </div>

      <div className="relative">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="Nội dung bài viết"
          data-placeholder={placeholder}
          onInput={emit}
          onBlur={() => { saveSelection(); emit(); }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          onTouchEnd={saveSelection}
          onPaste={onPaste}
          onDragEnter={(e) => { if (hasFiles(e)) { e.preventDefault(); dragDepth.current += 1; setDragOver(true); } }}
          onDragOver={(e) => { if (hasFiles(e)) { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } }}
          onDragLeave={() => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragOver(false); }}
          onDrop={onDrop}
          className={`rich-content rich-editor field min-h-[16rem] max-h-[65vh] overflow-y-auto !px-4 !py-3 sm:min-h-[22rem] sm:!px-5 sm:!py-4 ${dragOver ? "!border-accent ring-2 ring-accent/40" : ""}`}
        />
        {dragOver && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[var(--on-accent)]">
            ⬇ Thả ảnh để chèn vào đây
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickImage} />
      {uploading > 0 && <p className="text-sm text-muted">Đang tải {uploading} ảnh lên…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
