"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage } from "@/services/storage";
import { sanitizeHtml } from "@/utils/html";

/**
 * Trình soạn thảo: đậm, nghiêng, gạch chân, tiêu đề, trích dẫn, danh sách,
 * liên kết, chèn ảnh. Lưu nội dung dạng HTML.
 *
 * Bố cục: thanh công cụ là MỘT KHỐI RIÊNG phía trên; ô nhập chữ là khối riêng bên dưới,
 * có thanh cuộn của chính nó — thanh công cụ không bao giờ che chữ đang gõ.
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

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, user.id, "post-");
      onImageUploaded?.(url);
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

  const btn = "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg px-2 text-sm text-ink-soft transition hover:bg-soft hover:text-ink active:scale-95";
  const sep = <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />;
  // onMouseDown + preventDefault: giữ vùng chữ đang chọn (máy tính); điện thoại: khôi phục từ savedRange
  const B = (label: React.ReactNode, title: string, action: () => void) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={btn}
      onMouseDown={(e) => e.preventDefault()}
      onClick={action}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-ink">Nội dung</span>

      {/* ===== Thanh công cụ (khối riêng, nằm trên) ===== */}
      <div
        role="toolbar"
        aria-label="Định dạng văn bản"
        className="no-scrollbar flex flex-nowrap items-center gap-0.5 overflow-x-auto rounded-xl border border-line bg-soft/60 p-1 sm:flex-wrap"
      >
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
        {B(uploading ? "…" : "🖼", "Chèn ảnh vào nội dung", () => { saveSelection(); fileRef.current?.click(); })}
        {sep}
        {B("↶", "Hoàn tác (Ctrl+Z)", () => exec("undo"))}
        {B("↷", "Làm lại (Ctrl+Y)", () => exec("redo"))}
        {B("⨯", "Xoá định dạng", () => exec("removeFormat"))}
      </div>

      {/* ===== Ô nhập chữ (khối riêng, có thanh cuộn riêng) ===== */}
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
        className="rich-content rich-editor field min-h-[16rem] max-h-[65vh] overflow-y-auto !px-4 !py-3 sm:min-h-[22rem] sm:!px-5 sm:!py-4"
      />

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
      {uploading && <p className="text-sm text-muted">Đang tải ảnh lên…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
