"use client";

import { useState } from "react";
import { useSite } from "@/components/site/SiteSettingsProvider";
import Modal from "@/components/ui/Modal";
import { SITE_DEFAULTS, type TextKey } from "@/lib/siteContent";

/**
 * Chữ hiển thị trên trang mà Super Admin sửa được.
 * Bình thường: hiện như chữ thường. Đang sửa trang: có viền nét đứt, bấm vào để sửa (lưu ngay).
 */
export function EditableText({
  k,
  as = "span",
  className = "",
  multiline = false,
  label,
}: {
  k: TextKey;
  as?: React.ElementType;
  className?: string;
  multiline?: boolean;
  label?: string;
}) {
  const { text, editMode } = useSite();
  const [open, setOpen] = useState(false);
  const Tag = as;
  const value = text(k);

  if (!editMode) return <Tag className={className}>{value}</Tag>;

  return (
    <>
      <Tag
        className={`${className} editable`}
        role="button"
        tabIndex={0}
        title="Bấm để sửa"
        onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") { e.preventDefault(); setOpen(true); } }}
      >
        {value}
      </Tag>
      {open && <TextEditModal k={k} label={label ?? k} initial={value} multiline={multiline} onClose={() => setOpen(false)} />}
    </>
  );
}

function TextEditModal({
  k,
  label,
  initial,
  multiline,
  onClose,
}: {
  k: TextKey;
  label: string;
  initial: string;
  multiline: boolean;
  onClose: () => void;
}) {
  const { update } = useSite();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const fallback = SITE_DEFAULTS[k];
  const trimmed = v.trim();

  async function apply() {
    if (!trimmed) return;
    setBusy(true);
    try {
      await update(k, trimmed === fallback ? null : trimmed);
      onClose();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Sửa: ${label}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost mr-auto" onClick={() => setV(fallback)}>Về mặc định</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-primary" disabled={!trimmed || busy} onClick={apply}>{busy ? "Đang lưu…" : "Lưu"}</button>
        </>
      }
    >
      {multiline ? (
        <textarea autoFocus value={v} onChange={(e) => setV(e.target.value)} rows={5} maxLength={500} className="field" />
      ) : (
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} maxLength={120} className="field"
          onKeyDown={(e) => { if (e.key === "Enter") apply(); }} />
      )}
      <p className="mt-2 text-xs text-muted">Mặc định: “{fallback}”</p>
    </Modal>
  );
}
