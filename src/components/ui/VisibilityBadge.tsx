import { VISIBILITY, type Visibility } from "@/lib/visibility";

/** Nhãn nhỏ cho nội dung không công khai (Công khai thì không hiện gì, trừ khi showPublic) */
export default function VisibilityBadge({ value, showPublic = false }: { value?: Visibility | null; showPublic?: boolean }) {
  const v: Visibility = value ?? "public";
  if (v === "public" && !showPublic) return null;
  const cls = v === "private" ? "bg-soft text-ink-soft" : v === "unlisted" ? "bg-blue-500/15 text-blue-400" : "bg-green-500/15 text-green-500";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`} title={VISIBILITY[v].desc}>
      {VISIBILITY[v].icon} {VISIBILITY[v].label}
    </span>
  );
}
