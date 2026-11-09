/**
 * Cloudflare R2 (S3-compatible) — CHỈ chạy phía máy chủ.
 * Tự ký URL theo AWS Signature V4 (không cần cài thư viện).
 */
import { createHash, createHmac } from "node:crypto";

export const MEDIA_BUCKETS = ["music", "covers", "books", "images"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

/** Chỉ cho tải lên các đuôi tệp này (chặn html/svg/js…) và gán Content-Type cố định */
export const ALLOWED_TYPES: Record<MediaBucket, Record<string, string>> = {
  music: { mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", ogg: "audio/ogg", aac: "audio/aac", flac: "audio/flac" },
  covers: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" },
  images: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" },
  books: {
    pdf: "application/pdf",
    epub: "application/epub+zip",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain; charset=utf-8",
  },
};

export const MAX_BYTES: Record<MediaBucket, number> = {
  music: 50 * 1024 * 1024,
  books: 50 * 1024 * 1024,
  covers: 10 * 1024 * 1024,
  images: 10 * 1024 * 1024,
};

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
export const encodePath = (p: string) => p.split("/").map(enc).join("/");

const sha256hex = (s: string) => createHash("sha256").update(s).digest("hex");
const hmac = (key: Buffer | string, data: string) => createHmac("sha256", key).update(data).digest();

export interface PresignInput {
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  host: string;
  /** Đường dẫn ĐÃ mã hoá, bắt đầu bằng "/" */
  path: string;
  query?: Record<string, string>;
  /** Header bắt buộc phải gửi kèm khi dùng URL (vd content-type) */
  headers?: Record<string, string>;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  service?: string;
  expires?: number;
  now?: Date;
}

export function presign(i: PresignInput): string {
  const region = i.region ?? "auto";
  const service = i.service ?? "s3";
  const now = i.now ?? new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = `${date}/${region}/${service}/aws4_request`;

  const headers: Record<string, string> = { host: i.host };
  for (const [k, v] of Object.entries(i.headers ?? {})) headers[k.toLowerCase()] = v.trim();
  const names = Object.keys(headers).sort();
  const signedHeaders = names.join(";");

  const q: Record<string, string> = {
    ...(i.query ?? {}),
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${i.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(i.expires ?? 900),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQuery = Object.keys(q)
    .sort()
    .map((k) => `${enc(k)}=${enc(q[k])}`)
    .join("&");

  const canonicalRequest = [
    i.method,
    i.path,
    canonicalQuery,
    names.map((n) => `${n}:${headers[n]}\n`).join(""),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256hex(canonicalRequest)].join("\n");
  const kDate = hmac("AWS4" + i.secretAccessKey, date);
  const signature = createHmac("sha256", hmac(hmac(hmac(kDate, region), service), "aws4_request"))
    .update(stringToSign)
    .digest("hex");

  return `https://${i.host}${i.path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("Thiếu biến môi trường R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY hoặc R2_BUCKET.");
  }
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

/** Tạo URL đã ký cho một đối tượng trong bucket R2 (key = "music/<userId>/file.mp3") */
export function r2Url(
  method: PresignInput["method"],
  key: string | null,
  opts: { query?: Record<string, string>; headers?: Record<string, string>; expires?: number } = {},
): string {
  const c = config();
  return presign({
    method,
    host: `${c.accountId}.r2.cloudflarestorage.com`,
    path: `/${c.bucket}${key ? "/" + encodePath(key) : ""}`,
    query: opts.query,
    headers: opts.headers,
    expires: opts.expires,
    accessKeyId: c.accessKeyId,
    secretAccessKey: c.secretAccessKey,
  });
}

/** Xoá nhiều đối tượng (an toàn khi file đã mất) */
export async function r2Delete(keys: string[]): Promise<number> {
  let ok = 0;
  const queue = [...keys];
  const worker = async () => {
    for (let k = queue.shift(); k !== undefined; k = queue.shift()) {
      const res = await fetch(r2Url("DELETE", k, { expires: 120 }), { method: "DELETE" });
      if (res.ok || res.status === 404) ok++;
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, keys.length) }, worker));
  return ok;
}

export interface R2Object {
  key: string;
  size: number;
  lastModified: string | null;
}

/** Liệt kê mọi đối tượng có tiền tố prefix (tự lật trang) */
export async function r2List(prefix: string): Promise<R2Object[]> {
  const out: R2Object[] = [];
  let token: string | null = null;
  do {
    const query: Record<string, string> = { "list-type": "2", prefix, "max-keys": "1000" };
    if (token) query["continuation-token"] = token;
    const res: Response = await fetch(r2Url("GET", null, { query, expires: 120 }));
    if (!res.ok) throw new Error(`R2 list lỗi ${res.status}`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const block = m[1];
      const key = block.match(/<Key>([\s\S]*?)<\/Key>/)?.[1];
      if (!key) continue;
      out.push({
        key: decodeXml(key),
        size: Number(block.match(/<Size>(\d+)<\/Size>/)?.[1] ?? 0),
        lastModified: block.match(/<LastModified>([\s\S]*?)<\/LastModified>/)?.[1] ?? null,
      });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
      ? (xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] ?? null)
      : null;
    if (token) token = decodeXml(token);
  } while (token);
  return out;
}

function decodeXml(s: string) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

export function isBucket(v: unknown): v is MediaBucket {
  return typeof v === "string" && (MEDIA_BUCKETS as readonly string[]).includes(v);
}

/** "music/<userId>/x.mp3" -> { bucket, rest } hoặc null nếu không hợp lệ */
export function parseKey(key: string): { bucket: MediaBucket; path: string; owner: string } | null {
  const i = key.indexOf("/");
  if (i < 0) return null;
  const bucket = key.slice(0, i);
  const path = key.slice(i + 1);
  if (!isBucket(bucket) || !path || path.includes("..") || path.startsWith("/")) return null;
  return { bucket, path, owner: path.split("/")[0] };
}
