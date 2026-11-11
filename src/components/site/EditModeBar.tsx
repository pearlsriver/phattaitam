"use client";

import { useSite } from "@/components/site/SiteSettingsProvider";

/**
 * Thông báo nhỏ khi lưu nội dung trang (Đang lưu… / ✓ Đã lưu / lỗi).
 * Không còn thanh công cụ — bật/tắt bằng nút "Chỉnh sửa trang" trên menu.
 */
export default function EditModeBar() {
  const { status, editMode } = useSite();
  if (!status || (!editMode && status.kind !== "error")) return null;
  const color = status.kind === "error" ? "text-red-400" : status.kind === "saved" ? "text-green-400" : "text-ink-soft";
  return (
    <div role="status" aria-live="polite"
      className={`glass anim-in fixed left-1/2 top-[calc(env(safe-area-inset-top)+7rem)] z-[60] -translate-x-1/2 rounded-full px-4 py-1.5 text-sm shadow-xl md:top-20 ${color}`}>
      {status.text}
    </div>
  );
}
