import { ALLOWED_TYPES, MAX_BYTES, isBucket, r2Url } from "@/lib/r2";
import { authUser, jsonError } from "@/lib/serverAuth";
import { safeFileName } from "@/utils/slug";

export const runtime = "nodejs";

/**
 * Xin URL tải lên thẳng Cloudflare R2 (trình duyệt PUT trực tiếp — không đi qua máy chủ Vercel).
 * Body: { bucket, filename, size?, prefix? }
 */
export async function POST(req: Request) {
  const user = await authUser(req);
  if (!user) return jsonError("Bạn cần đăng nhập.", 401);

  let body: { bucket?: unknown; filename?: unknown; size?: unknown; prefix?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Dữ liệu không hợp lệ.");
  }

  const { bucket, filename } = body;
  if (!isBucket(bucket) || typeof filename !== "string" || !filename) return jsonError("Thiếu bucket hoặc tên tệp.");

  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  const contentType = ALLOWED_TYPES[bucket][ext];
  if (!contentType) {
    return jsonError(`Định dạng .${ext || "?"} không được phép. Cho phép: ${Object.keys(ALLOWED_TYPES[bucket]).join(", ")}.`);
  }

  const size = typeof body.size === "number" ? body.size : 0;
  if (size > MAX_BYTES[bucket]) return jsonError(`Tệp vượt quá ${Math.round(MAX_BYTES[bucket] / 1024 / 1024)} MB.`);

  const prefix = typeof body.prefix === "string" ? body.prefix.replace(/[^a-z0-9-]/gi, "").slice(0, 20) : "";
  const path = `${user.userId}/${prefix}${Date.now()}-${safeFileName(filename)}`;
  const key = `${bucket}/${path}`;

  try {
    const uploadUrl = r2Url("PUT", key, { headers: { "content-type": contentType }, expires: 900 });
    return Response.json({ path, key, uploadUrl, contentType });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Lỗi cấu hình R2.", 500);
  }
}
