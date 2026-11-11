"use client";

import { useState } from "react";
import { useSite } from "@/components/site/SiteSettingsProvider";
import Modal from "@/components/ui/Modal";
import { NAV_TARGETS, type NavItem } from "@/lib/siteContent";

/** Sửa menu chính: đổi tên, thứ tự, ẩn/hiện */
export default function NavEditModal({ onClose }: { onClose: () => void }) {
  const { nav, update } = useSite();
  const [items, setItems] = useState<NavItem[]>(nav.map((n) => ({ ...n })));
  const [busy, setBusy] = useState(false);

  const patch = (i: number, p: Partial<NavItem>) => setItems((cur) => cur.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const anyVisible = items.some((i) => i.visible);
  const valid = anyVisible && items.every((i) => i.label.trim());

  async function save(value: unknown) {
    setBusy(true);
    try {
      await update("nav", value);
      onClose();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Sửa menu chính"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost mr-auto" disabled={busy} onClick={() => save(null)}>Về mặc định</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Huỷ</button>
          <button type="button" className="btn btn-primary" disabled={!valid || busy}
            onClick={() => save(items.map((i) => ({ ...i, label: i.label.trim() })))}>{busy ? "Đang lưu…" : "Lưu"}</button>
        </>
      }
    >
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={it.href} className={`flex items-center gap-2 rounded-xl border border-line p-2 ${it.visible ? "" : "opacity-60"}`}>
            <input type="checkbox" checked={it.visible} onChange={(e) => patch(i, { visible: e.target.checked })}
              className="h-5 w-5 accent-[var(--accent)]" aria-label={`Hiện mục ${it.label}`} />
            <div className="min-w-0 flex-1">
              <input value={it.label} onChange={(e) => patch(i, { label: e.target.value })} maxLength={30} className="field !py-1.5" />
              <p className="mt-0.5 text-[11px] text-muted">{it.href} · mặc định: {NAV_TARGETS.find((t) => t.href === it.href)?.label}</p>
            </div>
            <button type="button" className="btn-icon !h-8 !w-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Lên">↑</button>
            <button type="button" className="btn-icon !h-8 !w-8" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Xuống">↓</button>
          </li>
        ))}
      </ul>
      {!anyVisible && <p className="mt-2 text-sm text-red-500">Cần hiện ít nhất một mục.</p>}
    </Modal>
  );
}
