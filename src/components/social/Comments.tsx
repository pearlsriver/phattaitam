"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Avatar from "@/components/social/Avatar";
import { useAuth } from "@/hooks/useAuth";
import { addComment, deleteComment, listComments } from "@/services/socialService";
import type { Comment, TargetType } from "@/types/social";
import { formatDateTime } from "@/utils/formatDate";

export default function Comments({ type, id }: { type: TargetType; id: string }) {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listComments(type, id));
    } catch {}
  }, [type, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addComment(type, id, user.id, body);
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được bình luận");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      <h2 className="mb-5 font-serif text-2xl font-semibold text-ink">Bình luận ({items.length})</h2>

      {user ? (
        <form onSubmit={submit} className="mb-8 space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Chia sẻ cảm nhận của bạn…"
            className="field"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy || !body.trim()} className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper disabled:opacity-50">
            {busy ? "Đang gửi…" : "Gửi bình luận"}
          </button>
        </form>
      ) : (
        <p className="mb-8 text-sm text-muted">
          <Link href="/login" className="text-accent hover:underline">Đăng nhập</Link> để bình luận.
        </p>
      )}

      <ul className="space-y-5">
        {items.map((c) => (
          <li key={c.id} className="flex gap-3">
            <Link href={`/tac-gia/${c.user_id}`}>
              <Avatar url={c.author?.avatar_url} name={c.author?.full_name} size={36} />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <Link href={`/tac-gia/${c.user_id}`} className="font-medium text-ink hover:underline">
                  {c.author?.full_name ?? "Ẩn danh"}
                </Link>
                <span className="ml-2 text-xs text-muted">{formatDateTime(c.created_at)}</span>
                {(user?.id === c.user_id || isAdmin) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm("Xoá bình luận này?")) {
                        await deleteComment(c.id);
                        load();
                      }
                    }}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Xoá
                  </button>
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-ink-soft">{c.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
