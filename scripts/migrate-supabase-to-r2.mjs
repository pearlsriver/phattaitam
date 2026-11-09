#!/usr/bin/env node
/**
 * Chuyển toàn bộ tệp từ Supabase Storage sang Cloudflare R2.
 *
 *   node scripts/migrate-supabase-to-r2.mjs --dry-run      (chỉ liệt kê, không chép)
 *   node scripts/migrate-supabase-to-r2.mjs                (chép sang R2, KHÔNG xoá bản gốc)
 *   node scripts/migrate-supabase-to-r2.mjs --delete       (chép + xoá bản gốc trên Supabase SAU KHI kiểm tra khớp dung lượng)
 *
 * Chạy lại nhiều lần được: tệp đã có trên R2 (cùng dung lượng) sẽ được bỏ qua.
 * Cần biến môi trường (đặt trong .env.local hoặc PowerShell):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (khoá "secret"/"service_role" — CHỈ dùng trên máy bạn)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */
import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---- đọc .env.local (nếu có) ----
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const DELETE_AFTER = args.has("--delete");

const need = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error("Thiếu biến môi trường:", missing.join(", "));
  process.exit(1);
}

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---- ký URL R2 (AWS Signature V4) — cùng thuật toán với src/lib/r2.ts ----
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const encPath = (p) => p.split("/").map(enc).join("/");
const sha = (s) => createHash("sha256").update(s).digest("hex");
const hmac = (k, d) => createHmac("sha256", k).update(d).digest();

function presign(method, key, headers = {}) {
  const host = `${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const path = `/${process.env.R2_BUCKET}/${encPath(key)}`;
  const now = new Date();
  const amz = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amz.slice(0, 8);
  const scope = `${date}/auto/s3/aws4_request`;
  const hs = { host, ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])) };
  const names = Object.keys(hs).sort();
  const signed = names.join(";");
  const q = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${process.env.R2_ACCESS_KEY_ID}/${scope}`,
    "X-Amz-Date": amz,
    "X-Amz-Expires": "900",
    "X-Amz-SignedHeaders": signed,
  };
  const cq = Object.keys(q).sort().map((k) => `${enc(k)}=${enc(q[k])}`).join("&");
  const creq = [method, path, cq, names.map((n) => `${n}:${hs[n]}\n`).join(""), signed, "UNSIGNED-PAYLOAD"].join("\n");
  const sts = ["AWS4-HMAC-SHA256", amz, scope, sha(creq)].join("\n");
  const kSign = hmac(hmac(hmac(hmac("AWS4" + process.env.R2_SECRET_ACCESS_KEY, date), "auto"), "s3"), "aws4_request");
  const sig = createHmac("sha256", kSign).update(sts).digest("hex");
  return `https://${host}${path}?${cq}&X-Amz-Signature=${sig}`;
}

const TYPES = {
  mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac", flac: "audio/flac",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml",
  pdf: "application/pdf", epub: "application/epub+zip", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain; charset=utf-8",
};
const typeOf = (path, fallback) => TYPES[path.split(".").pop().toLowerCase()] || fallback || "application/octet-stream";

// ---- liệt kê tệp trong Supabase ----
async function listAll(bucket, prefix = "") {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await sb.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error) throw error;
    for (const it of data ?? []) {
      const full = prefix ? `${prefix}/${it.name}` : it.name;
      if (it.id === null) out.push(...(await listAll(bucket, full)));
      else if (it.name !== ".emptyFolderPlaceholder") out.push({ bucket, path: full, size: it.metadata?.size ?? 0 });
    }
    if (!data || data.length < 1000) break;
  }
  return out;
}

async function r2Size(key) {
  const res = await fetch(presign("HEAD", key), { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HEAD ${key} -> ${res.status}`);
  return Number(res.headers.get("content-length") ?? -1);
}

async function copyOne(f) {
  const key = `${f.bucket}/${f.path}`;
  const existing = await r2Size(key);
  if (existing !== null && existing === f.size && f.size > 0) return "skip";
  if (DRY) return "would-copy";

  const { data: blob, error } = await sb.storage.from(f.bucket).download(f.path);
  if (error) throw new Error(`Tải ${key} từ Supabase lỗi: ${error.message}`);
  const body = Buffer.from(await blob.arrayBuffer());
  const ct = typeOf(f.path, blob.type);
  const res = await fetch(presign("PUT", key, { "content-type": ct }), { method: "PUT", headers: { "Content-Type": ct }, body });
  if (!res.ok) throw new Error(`PUT ${key} -> ${res.status} ${await res.text().catch(() => "")}`);

  const after = await r2Size(key);
  if (after !== body.length) throw new Error(`Kiểm tra dung lượng ${key} không khớp (${after} ≠ ${body.length})`);
  return "copied";
}

// ---- chạy ----
const buckets = ["images", "covers", "books", "music"];
const all = [];
for (const b of buckets) {
  const files = await listAll(b);
  console.log(`• ${b}: ${files.length} tệp, ${(files.reduce((n, f) => n + f.size, 0) / 1024 / 1024).toFixed(1)} MB`);
  all.push(...files);
}
if (DRY) console.log("\n(chế độ --dry-run: chỉ kiểm tra, chưa chép gì)\n");

const stats = { copied: 0, skip: 0, "would-copy": 0, failed: 0 };
const ok = [];
const queue = [...all];
let done = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      try {
        const r = await copyOne(f);
        stats[r]++;
        if (r === "copied" || r === "skip") ok.push(f);
      } catch (e) {
        stats.failed++;
        console.error(`  ✗ ${f.bucket}/${f.path}: ${e.message}`);
      }
      if (++done % 10 === 0 || done === all.length) console.log(`  ${done}/${all.length}…`);
    }
  }),
);

console.log("\nKết quả:", stats);

if (DELETE_AFTER && !DRY) {
  if (stats.failed) {
    console.error("Có tệp lỗi nên KHÔNG xoá bản gốc trên Supabase. Hãy chạy lại script cho đến khi hết lỗi.");
    process.exit(1);
  }
  for (const b of buckets) {
    const paths = ok.filter((f) => f.bucket === b).map((f) => f.path);
    for (let i = 0; i < paths.length; i += 100) {
      const { error } = await sb.storage.from(b).remove(paths.slice(i, i + 100));
      if (error) console.error(`  ✗ xoá ${b}:`, error.message);
    }
    if (paths.length) console.log(`  đã xoá ${paths.length} tệp trong Supabase/${b}`);
  }
}
if (stats.failed) process.exit(1);
console.log(DRY ? "Xong (dry-run)." : "Xong. Bước tiếp theo: chạy supabase/after_r2_migration.sql");
