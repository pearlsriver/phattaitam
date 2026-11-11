"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { useSite } from "@/components/site/SiteSettingsProvider";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { removeImageUrls, uploadImage } from "@/services/storage";

/** Logo trang web (Super Admin đổi được khi đang sửa trang) */
export default function SiteLogo({
  size = "sm",
  className = "",
  alt = "Logo Phật Tại Tâm",
}: {
  size?: "sm" | "lg";
  className?: string;
  alt?: string;
}) {
  const { logo, editMode } = useSite();
  const [open, setOpen] = useState(false);
  const src = logo ?? (size === "sm" ? "/logo-sm.png" : "/logo.png");

  if (!editMode) return <img src={src} alt={alt} className={`object-cover ${className}`} />;

  return (
    <>
      <img
        src={src}
        alt={alt}
        role="button"
        tabIndex={0}
        title="Bấm để đổi logo"
        className={`editable object-cover ${className}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setOpen(true); } }}
      />
      {open && <LogoEditModal onClose={() => setOpen(false)} />}
    </>
  );
}

function LogoEditModal({ onClose }: { onClose: () => void }) {
  const { logo, update } = useSite();
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(logo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Ảnh đã tải lên trong lần mở hộp này */
  const uploads = useRef<string[]>([]);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !user) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadImage(f, user.id, "logo-");
      uploads.current.push(url);
      setPreview(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được ảnh");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    const junk = uploads.current;
    uploads.current = [];
    onClose();
    if (junk.length) await removeImageUrls(junk);
  }

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      await update("site.logo", preview);
      // Xoá logo cũ (nếu đã thay) và các ảnh đã thử nhưng không dùng
      const junk = uploads.current.filter((u) => u !== preview);
      if (logo && logo !== preview) junk.push(logo);
      uploads.current = [];
      onClose();
      if (junk.length) await removeImageUrls(junk);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được");
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Đổi logo trang web"
      onClose={cancel}
      footer={
        <>
          <button type="button" className="btn btn-ghost mr-auto" onClick={() => setPreview(null)}>Dùng logo mặc định</button>
          <button type="button" className="btn btn-secondary" onClick={cancel}>Huỷ</button>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={apply}>{busy ? "Đang lưu…" : "Lưu"}</button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <img src={preview ?? "/logo.png"} alt="Xem trước logo" className="h-32 w-32 rounded-full object-cover ring-1 ring-line" />
        <label className="btn btn-secondary cursor-pointer">
          {busy ? "Đang tải…" : "📷 Chọn ảnh logo"}
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} />
        </label>
        <p className="text-center text-xs text-muted">
          Nên dùng ảnh vuông. Logo hiển thị dạng tròn ở thanh menu, trang chủ và trang đăng nhập.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </Modal>
  );
}
