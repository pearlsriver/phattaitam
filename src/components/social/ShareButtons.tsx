"use client";

import { useState } from "react";

/** Chia sẻ: Facebook, Zalo (qua nút chia sẻ của điện thoại), sao chép link */
export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const btn = "rounded-full border border-line px-3 py-1.5 text-sm text-ink-soft hover:bg-soft";

  const url = () => window.location.href;

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: url() });
      } catch {}
    } else {
      copy();
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={btn}
        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url())}`, "_blank", "noopener,width=640,height=560")}>
        Facebook
      </button>
      <button type="button" className={btn} onClick={nativeShare} title="Chia sẻ qua Zalo, Messenger… trên điện thoại">
        Chia sẻ (Zalo…)
      </button>
      <button type="button" className={btn} onClick={copy}>{copied ? "✓ Đã chép link" : "🔗 Chép link"}</button>
    </div>
  );
}
