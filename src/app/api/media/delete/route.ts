import { parseKey, r2Delete } from "@/lib/r2";
import { authUser, jsonError } from "@/lib/serverAuth";

export const runtime = "nodejs";

/**
 * Xoá tệp khỏi R2. Body: { keys: ["images/<userId>/a.jpg", ...] }
 * Người dùng chỉ xoá được tệp trong thư mục của mình; admin xoá được mọi tệp.
 */
export async function POST(req: Request) {
  const user = await authUser(req);
  if (!user) return jsonError("Bạn cần đăng nhập.", 401);

  let body: { keys?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError("Dữ liệu không hợp lệ.");
  }
  if (!Array.isArray(body.keys)) return jsonError("Thiếu danh sách keys.");

  const allowed: string[] = [];
  let skipped = 0;
  for (const k of body.keys.slice(0, 500)) {
    const p = typeof k === "string" ? parseKey(k) : null;
    if (p && (user.isAdmin || p.owner === user.userId)) allowed.push(`${p.bucket}/${p.path}`);
    else skipped++;
  }

  try {
    const deleted = await r2Delete(allowed);
    return Response.json({ deleted, skipped });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Không xoá được.", 500);
  }
}
