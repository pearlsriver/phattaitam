"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getLikes, setLike } from "@/services/socialService";
import type { TargetType } from "@/types/social";
import { formatCount } from "@/utils/formatDate";

export default function LikeButton({ type, id, compact = false }: { type: TargetType; id: string; compact?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLikes(type, id, user?.id).then((r) => {
      setCount(r.count);
      setLiked(r.liked);
    }).catch(() => {});
  }, [type, id, user?.id]);

  async function toggle() {
    if (!user) return router.push("/login");
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await setLike(type, id, user.id, next);
    } catch {
      setLiked(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Bỏ yêu thích" : "Yêu thích"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        liked ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-950/40" : "border-line text-ink-soft hover:bg-soft"
      } ${compact ? "px-2.5 py-1" : ""}`}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{formatCount(count)}</span>
    </button>
  );
}
