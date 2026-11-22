"use client";

import { useState } from "react";
import { shareUrl, VISIBILITY, type Visibility } from "@/lib/visibility";
import { regenerateShareToken } from "@/services/shareService";

/**
 * Ô dành cho chủ nội dung (và Admin) trên trang bài viết / bài hát không công khai:
 * - "Chỉ người có link": hiện link chia sẻ, sao chép, tạo link mới.
 * - "Riêng tư": nhắc chỉ mình bạn xem được.
 */
export default function ShareLinkBox({
  kind,
  id,
  slugOrId,
  token,
  visibility,
  published,
  onTokenChange,
}: {
  kind: "post" | "song";
  id: string;
  slugOrId: string;
  token: string;
  visibility: Visibility;
  published: boolean;
  onTokenChange: (t: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (visibility === "public") return null;

  if (visibility === "private") {
    return (
      <div className="mt-6 rounded-2xl border border-line bg-surface p-4 text-sm text-ink-soft">
        {VISIBILITY.private.icon} <b>Riêng tư</b> — chỉ bạn (và quản trị viên) xem được. Muốn chia sẻ, bấm <b>Sửa</b> và chọn “Chỉ người có link”.
      </div>
    );
  }

  const url = shareUrl(kind, slugOrId, token);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function regenerate() {
    if (!confirm("Tạo link mới? Link cũ đã chia sẻ sẽ không mở được nữa.")) return;
    setBusy(true);
    setError(null);
    try {
      onTokenChange(await regenerateShareToken(kind, id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được link mới");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-2 rounded-2xl border border-blue-400/40 bg-blue-500/5 p-4 text-sm">
      <p className="text-ink">{VISIBILITY.unlisted.icon} <b>Chỉ người có link</b> — gửi link này cho người bạn muốn chia sẻ:</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input readOnly value={url} onFocus={(e) => e.target.select()} className="field !py-2 text-xs" aria-label="Link chia sẻ" />
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn btn-primary !py-2" onClick={copy}>{copied ? "✓ Đã chép" : "🔗 Chép link"}</button>
          <button type="button" className="btn btn-secondary !py-2" disabled={busy} onClick={regenerate}>↻ Link mới</button>
        </div>
      </div>
      {!published && <p className="text-xs text-yellow-600">Link chỉ mở được sau khi quản trị viên duyệt.</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
