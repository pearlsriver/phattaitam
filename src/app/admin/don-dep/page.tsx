"use client";

import Link from "next/link";
import { useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { deleteOrphans, formatBytes, scanStorage, type BucketReport } from "@/services/cleanupService";

const FREE_LIMIT = 1024 ** 3; // 1 GB — gói Supabase Free

function Cleanup() {
  const [reports, setReports] = useState<BucketReport[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  async function scan() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      setReports(await scanStorage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không quét được");
    } finally {
      setBusy(false);
    }
  }

  async function clean() {
    if (!reports) return;
    const all = reports.flatMap((r) => r.orphans);
    if (!all.length) return;
    if (!confirm(`Xoá vĩnh viễn ${all.length} file không còn dùng (${formatBytes(all.reduce((n, f) => n + f.size, 0))})?`)) return;
    setBusy(true);
    setError(null);
    try {
      const n = await deleteOrphans(all);
      setMsg(`Đã xoá ${n} file.`);
      setReports(await scanStorage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xoá được");
    } finally {
      setBusy(false);
    }
  }

  const totalBytes = reports?.reduce((n, r) => n + r.totalBytes, 0) ?? 0;
  const orphanCount = reports?.reduce((n, r) => n + r.orphans.length, 0) ?? 0;
  const orphanBytes = reports?.reduce((n, r) => n + r.orphanBytes, 0) ?? 0;
  const pct = Math.min(100, (totalBytes / FREE_LIMIT) * 100);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin" className="text-sm text-accent hover:underline">← Quản trị</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-ink">Dọn dẹp kho lưu trữ</h1>
      <p className="mt-2 text-ink-soft">
        Tìm các file không còn được dùng ở đâu (ví dụ ảnh tải lên rồi đóng tab không lưu bài). File mới tải lên trong 24 giờ qua được bỏ qua.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={scan} disabled={busy} className="rounded-full bg-ink px-6 py-3 font-medium text-paper disabled:opacity-50">
          {busy ? "Đang xử lý…" : "🔍 Quét kho lưu trữ"}
        </button>
        {orphanCount > 0 && (
          <button type="button" onClick={clean} disabled={busy} className="rounded-full bg-red-700 px-6 py-3 font-medium text-white disabled:opacity-50">
            🗑 Xoá {orphanCount} file thừa ({formatBytes(orphanBytes)})
          </button>
        )}
      </div>
      {msg && <p className="mt-4 text-green-600">{msg}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {reports && (
        <>
          <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-ink">Tổng dung lượng: {formatBytes(totalBytes)}</span>
              <span className="text-muted">{pct.toFixed(1)}% của 1 GB (gói Free)</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-soft">
              <div className={`h-full ${pct > 85 ? "bg-red-600" : "bg-accent"}`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {reports.map((r) => (
              <div key={r.bucket} className="flex flex-wrap items-center gap-3 p-4">
                <div className="flex-1">
                  <p className="font-medium text-ink">{r.label}</p>
                  <p className="text-xs text-muted">{r.total} file · {formatBytes(r.totalBytes)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm ${r.orphans.length ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                  {r.orphans.length ? `${r.orphans.length} thừa · ${formatBytes(r.orphanBytes)}` : "Sạch"}
                </span>
              </div>
            ))}
          </div>

          {orphanCount > 0 && (
            <div className="mt-4">
              <button type="button" onClick={() => setShowList(!showList)} className="text-sm text-accent hover:underline">
                {showList ? "Ẩn danh sách" : "Xem danh sách file thừa"}
              </button>
              {showList && (
                <ul className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-line bg-surface p-3 text-xs text-ink-soft">
                  {reports.flatMap((r) => r.orphans).map((f) => (
                    <li key={`${f.bucket}/${f.path}`} className="truncate py-0.5">
                      <span className="text-muted">{f.bucket}/</span>{f.path} — {formatBytes(f.size)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CleanupPage() {
  return <RequireAuth admin><Cleanup /></RequireAuth>;
}
