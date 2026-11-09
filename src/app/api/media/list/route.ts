import { isBucket, r2List } from "@/lib/r2";
import { authUser, jsonError } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liệt kê tệp trong một bucket (chỉ admin) — dùng cho trang Dọn dẹp */
export async function GET(req: Request) {
  const user = await authUser(req);
  if (!user?.isAdmin) return jsonError("Chỉ quản trị viên được xem.", 403);

  const bucket = new URL(req.url).searchParams.get("bucket");
  if (!isBucket(bucket)) return jsonError("bucket không hợp lệ.");

  try {
    const objects = await r2List(`${bucket}/`);
    return Response.json({
      files: objects.map((o) => ({
        key: o.key,
        path: o.key.slice(bucket.length + 1),
        size: o.size,
        lastModified: o.lastModified,
      })),
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Không liệt kê được.", 500);
  }
}
