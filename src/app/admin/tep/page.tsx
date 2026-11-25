"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Modal from "@/components/ui/Modal";
import { publicUrl } from "@/lib/supabase";
import { formatBytes } from "@/services/cleanupService";
import { BUCKETS, BUCKET_INFO, deleteFiles, loadAllFiles, type ManagedFile } from "@/services/fileManagerService";
import { formatDateTime } from "@/utils/formatDate";
import { matchSearch } from "@/utils/slug";

type BucketFilter = ManagedFile["bucket"] | "all";
type UseFilter = "all" | "used" | "unused";
type Sort = "new" | "old" | "big" | "small" | "name";

const PAGE = 100;
const isImage = (f: ManagedFile) => f.bucket === "covers" || f.bucket === "images";
const isPdf = (f: ManagedFile) => f.path.toLowerCase().endsWith(".pdf");
const fileUrl = (f: ManagedFile) => publicUrl(f.bucket, f.path);
const downloadUrl = (f: ManagedFile) => publicUrl(f.bucket, f.path, f.name);

function FileManager() {
  const [files, setFiles] = useState<ManagedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [bucket, setBucket] = useState<BucketFilter>("all");
  const [use, setUse] = useState<UseFilter>("all");
  const [owner, setOwner] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<ManagedFile | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await loadAllFiles());
      setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách tệp.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => setLimit(PAGE), [bucket, use, owner, sort, q]);

  /* ---------- Thống kê ---------- */
  const stats = useMemo(() => {
    const by = Object.fromEntries(BUCKETS.map((b) => [b, { count: 0, bytes: 0 }])) as Record<string, { count: number; bytes: number }>;
    let unusedBytes = 0;
    let unusedCount = 0;
    for (const f of files) {
      by[f.bucket].count++;
      by[f.bucket].bytes += f.size;
      if (!f.usages.length) { unusedCount++; unusedBytes += f.size; }
    }
    const total = files.reduce((n, f) => n + f.size, 0);
    return { by, total, unusedBytes, unusedCount };
  }, [files]);

  const owners = useMemo(() => {
    const m = new Map<string, { name: string; bytes: number; count: number }>();
    for (const f of files) {
      const o = m.get(f.ownerId) ?? { name: f.ownerName, bytes: 0, count: 0 };
      o.bytes += f.size;
      o.count++;
      m.set(f.ownerId, o);
    }
    return [...m.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
  }, [files]);

  /* ---------- Lọc & sắp xếp ---------- */
  const shown = useMemo(() => {
    const list = files.filter(
      (f) =>
        (bucket === "all" || f.bucket === bucket) &&
        (use === "all" || (use === "used" ? f.usages.length > 0 : f.usages.length === 0)) &&
        (owner === "all" || f.ownerId === owner) &&
        matchSearch(`${f.name} ${f.path} ${f.ownerName} ${f.usages.map((u) => u.label).join(" ")}`, q),
    );
    const t = (f: ManagedFile) => (f.lastModified ? new Date(f.lastModified).getTime() : 0);
    return list.sort((a, b) =>
      sort === "new" ? t(b) - t(a) : sort === "old" ? t(a) - t(b) : sort === "big" ? b.size - a.size : sort === "small" ? a.size - b.size : a.name.localeCompare(b.name, "vi"),
    );
  }, [files, bucket, use, owner, sort, q]);

  const visible = shown.slice(0, limit);
  const selectedFiles = files.filter((f) => selected.has(f.key));
  const selectedBytes = selectedFiles.reduce((n, f) => n + f.size, 0);
  const allVisibleSelected = visible.length > 0 && visible.every((f) => selected.has(f.key));

  function toggle(key: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  function toggleAllVisible() {
    setSelected((s) => {
      const n = new Set(s);
      if (allVisibleSelected) visible.forEach((f) => n.delete(f.key));
      else visible.forEach((f) => n.add(f.key));
      return n;
    });
  }

  async function remove(list: ManagedFile[]) {
    if (!list.length) return;
    const inUse = list.filter((f) => f.usages.length);
    const total = formatBytes(list.reduce((n, f) => n + f.size, 0));
    if (inUse.length) {
      const sample = inUse.slice(0, 5).map((f) => `• ${f.name} — ${f.usages[0].label}`).join("\n");
      const typed = prompt(
        `⚠ ${inUse.length} tệp ĐANG ĐƯỢC DÙNG trên trang. Xoá sẽ làm mất nhạc/ảnh/sách ở các nội dung đó:\n${sample}${inUse.length > 5 ? "\n…" : ""}\n\nGõ chữ XOA để xác nhận xoá vĩnh viễn ${list.length} tệp (${total}):`,
      );
      if (typed?.trim().toUpperCase() !== "XOA") return;
    } else if (!confirm(`Xoá vĩnh viễn ${list.length} tệp không dùng (${total})?`)) {
      return;
    }
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const n = await deleteFiles(list.map((f) => f.key));
      setMsg(`Đã xoá ${n} tệp (${total}).`);
      setPreview(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xoá được.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(f: ManagedFile) {
    try {
      await navigator.clipboard.writeText(fileUrl(f));
      setMsg(`Đã chép link: ${f.name}`);
    } catch {}
  }

  const chip = (on: boolean) => `chip !px-3 !py-1 !text-sm ${on ? "chip-on" : ""}`;
  const usagePct = Math.min(100, (stats.total / (10 * 1024 ** 3)) * 100);

  return (
    <div>
      <Link href="/admin" className="text-sm text-accent hover:underline">← Quản trị</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink sm:text-4xl">Quản lý tệp</h1>
          <p className="mt-1 text-ink-soft">Toàn bộ tệp trên Cloudflare R2 — xem, tải về, chép link, xoá; biết tệp đang được dùng ở đâu.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading || busy}>↻ Tải lại</button>
      </div>

      {/* ---------- Tổng quan ---------- */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-line bg-surface p-4 lg:col-span-1">
          <p className="text-xs text-muted">Tổng dung lượng</p>
          <p className="font-serif text-2xl font-semibold text-ink">{formatBytes(stats.total)}</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-soft">
            <div className={`h-full ${usagePct > 85 ? "bg-red-600" : "bg-accent"}`} style={{ width: `${usagePct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted">{usagePct.toFixed(1)}% của 10 GB miễn phí</p>
        </div>
        {BUCKETS.map((b) => (
          <button key={b} type="button" onClick={() => setBucket(bucket === b ? "all" : b)}
            className={`rounded-2xl border p-4 text-left transition hover:border-accent ${bucket === b ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>
            <p className="text-xs text-muted">{BUCKET_INFO[b].icon} {BUCKET_INFO[b].label}</p>
            <p className="font-serif text-xl font-semibold text-ink">{formatBytes(stats.by[b]?.bytes ?? 0)}</p>
            <p className="text-xs text-muted">{stats.by[b]?.count ?? 0} tệp</p>
          </button>
        ))}
      </section>

      {stats.unusedCount > 0 && (
        <p className="mt-3 text-sm text-yellow-600">
          Có {stats.unusedCount} tệp không còn được dùng ({formatBytes(stats.unusedBytes)}).{" "}
          <button type="button" className="underline" onClick={() => { setUse("unused"); setBucket("all"); }}>Xem các tệp này</button>
        </p>
      )}

      {/* ---------- Bộ lọc ---------- */}
      <section className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={chip(bucket === "all")} onClick={() => setBucket("all")}>Tất cả kho</button>
          {BUCKETS.map((b) => (
            <button key={b} type="button" className={chip(bucket === b)} onClick={() => setBucket(b)}>{BUCKET_INFO[b].icon} {BUCKET_INFO[b].label}</button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={use} onChange={(e) => setUse(e.target.value as UseFilter)} className="field !w-auto !rounded-full !py-1.5 text-sm">
            <option value="all">Mọi tình trạng</option>
            <option value="used">Đang dùng</option>
            <option value="unused">Không dùng</option>
          </select>
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className="field !w-auto max-w-56 !rounded-full !py-1.5 text-sm">
            <option value="all">Mọi thành viên</option>
            {owners.map(([id, o]) => <option key={id} value={id}>{o.name} ({formatBytes(o.bytes)})</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !w-auto !rounded-full !py-1.5 text-sm">
            <option value="new">Mới nhất</option>
            <option value="old">Cũ nhất</option>
            <option value="big">Lớn nhất</option>
            <option value="small">Nhỏ nhất</option>
            <option value="name">Tên A–Z</option>
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm tên tệp, thành viên, bài viết…" className="field !w-full !rounded-full sm:ml-auto sm:!w-72" />
        </div>
      </section>

      {msg && <p className="mt-4 text-sm text-green-500">{msg}</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {/* ---------- Thanh chọn nhiều ---------- */}
      {selected.size > 0 && (
        <div className="glass sticky top-28 z-20 mt-4 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-2 md:top-20">
          <span className="text-sm text-ink">Đã chọn {selected.size} tệp ({formatBytes(selectedBytes)})</span>
          <button type="button" className="btn btn-ghost !py-1.5" onClick={() => setSelected(new Set())}>Bỏ chọn</button>
          <button type="button" className="btn btn-danger ml-auto !py-1.5" disabled={busy} onClick={() => remove(selectedFiles)}>🗑 Xoá đã chọn</button>
        </div>
      )}

      {/* ---------- Danh sách ---------- */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="flex items-center gap-3 border-b border-line px-4 py-2 text-xs text-muted">
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4 accent-[var(--accent)]" aria-label="Chọn tất cả đang hiện" />
          <span>{loading ? "Đang tải…" : `${shown.length} tệp · ${formatBytes(shown.reduce((n, f) => n + f.size, 0))}`}</span>
        </div>

        <ul className="divide-y divide-line">
          {visible.map((f) => (
            <li key={f.key} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${selected.has(f.key) ? "row-active" : ""}`}>
              <input type="checkbox" checked={selected.has(f.key)} onChange={() => toggle(f.key)} className="h-4 w-4 accent-[var(--accent)]" aria-label={`Chọn ${f.name}`} />
              <button type="button" onClick={() => setPreview(f)} className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-soft" aria-label={`Xem ${f.name}`}>
                {isImage(f) ? (
                  <img src={fileUrl(f)} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl">{BUCKET_INFO[f.bucket].icon}</span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => setPreview(f)} className="block max-w-full truncate text-left font-medium text-ink hover:underline">{f.name}</button>
                <p className="truncate text-xs text-muted">
                  {formatBytes(f.size)} · {f.lastModified ? formatDateTime(f.lastModified) : "—"} · {f.ownerName}
                </p>
                <p className="truncate text-xs">
                  {f.usages.length ? (
                    f.usages[0].href ? <Link href={f.usages[0].href} className="text-accent hover:underline">{f.usages[0].label}</Link> : <span className="text-accent">{f.usages[0].label}</span>
                  ) : (
                    <span className="text-yellow-600">Không dùng</span>
                  )}
                  {f.usages.length > 1 && <span className="text-muted"> · +{f.usages.length - 1} nơi khác</span>}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <a href={downloadUrl(f)} className="btn-icon" title="Tải về" aria-label="Tải về">⬇</a>
                <button type="button" className="btn-icon" title="Chép link" aria-label="Chép link" onClick={() => copyLink(f)}>🔗</button>
                <button type="button" className="btn-icon text-[#ef6a6a]" title="Xoá" aria-label="Xoá" disabled={busy} onClick={() => remove([f])}>🗑</button>
              </div>
            </li>
          ))}
          {!loading && !shown.length && <li className="p-4 text-sm text-muted">Không có tệp phù hợp.</li>}
        </ul>

        {shown.length > limit && (
          <div className="border-t border-line p-3 text-center">
            <button type="button" className="btn btn-secondary !py-1.5" onClick={() => setLimit((n) => n + PAGE)}>Xem thêm ({shown.length - limit} tệp)</button>
          </div>
        )}
      </section>

      {/* ---------- Xem trước ---------- */}
      {preview && (
        <Modal
          title={preview.name}
          wide
          onClose={() => setPreview(null)}
          footer={
            <>
              <button type="button" className="btn btn-danger mr-auto" disabled={busy} onClick={() => remove([preview])}>🗑 Xoá</button>
              <button type="button" className="btn btn-secondary" onClick={() => copyLink(preview)}>🔗 Chép link</button>
              <a href={downloadUrl(preview)} className="btn btn-primary">⬇ Tải về</a>
            </>
          }
        >
          <div className="space-y-4">
            {isImage(preview) && <img src={fileUrl(preview)} alt={preview.name} className="mx-auto max-h-[50vh] rounded-xl object-contain" />}
            {preview.bucket === "music" && <audio controls src={fileUrl(preview)} className="w-full" />}
            {preview.bucket === "books" && (
              <a href={fileUrl(preview)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                {isPdf(preview) ? "📖 Mở PDF trong tab mới" : "Mở tệp trong tab mới"}
              </a>
            )}
            <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted">Kho</dt><dd className="text-ink">{BUCKET_INFO[preview.bucket].icon} {BUCKET_INFO[preview.bucket].label}</dd>
              <dt className="text-muted">Dung lượng</dt><dd className="text-ink">{formatBytes(preview.size)}</dd>
              <dt className="text-muted">Tải lên</dt><dd className="text-ink">{preview.lastModified ? formatDateTime(preview.lastModified) : "—"}</dd>
              <dt className="text-muted">Thành viên</dt><dd><Link href={`/tac-gia/${preview.ownerId}`} className="text-accent hover:underline">{preview.ownerName}</Link></dd>
              <dt className="text-muted">Đường dẫn</dt><dd className="break-all text-xs text-ink-soft">{preview.key}</dd>
              <dt className="text-muted">Đang dùng</dt>
              <dd>
                {preview.usages.length ? (
                  <ul className="space-y-1">
                    {preview.usages.map((u, i) => (
                      <li key={i}>{u.href ? <Link href={u.href} className="text-accent hover:underline">{u.label}</Link> : u.label}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-yellow-600">Không dùng ở đâu — có thể xoá an toàn</span>
                )}
              </dd>
            </dl>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function FileManagerPage() {
  return <RequireAuth superAdmin><FileManager /></RequireAuth>;
}
