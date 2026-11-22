"use client";

import { VISIBILITY, VISIBILITY_ORDER, type Visibility } from "@/lib/visibility";

/** Chọn chế độ hiển thị: Công khai / Chỉ người có link / Riêng tư */
export default function VisibilityPicker({
  value,
  onChange,
  needsApproval = false,
}: {
  value: Visibility;
  onChange: (v: Visibility) => void;
  /** Thành viên mới: Công khai và Có link phải chờ duyệt */
  needsApproval?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-ink">Ai được xem?</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {VISIBILITY_ORDER.map((v) => {
          const on = value === v;
          return (
            <label
              key={v}
              className={`flex cursor-pointer flex-col rounded-xl border p-3 transition ${
                on ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-surface hover:border-accent/50"
              }`}
            >
              <input type="radio" name="visibility" value={v} checked={on} onChange={() => onChange(v)} className="sr-only" />
              <span className="font-medium text-ink">{VISIBILITY[v].icon} {VISIBILITY[v].label}</span>
              <span className="mt-1 text-xs leading-snug text-muted">{VISIBILITY[v].desc}</span>
            </label>
          );
        })}
      </div>
      {needsApproval && value !== "private" && (
        <p className="mt-2 text-xs text-muted">Nội dung {VISIBILITY[value].label.toLowerCase()} cần quản trị viên duyệt trước khi người khác xem được.</p>
      )}
    </fieldset>
  );
}
