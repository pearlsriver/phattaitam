import { parseKey, r2Url } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tải tệp về với tên đẹp: chuyển hướng tới URL R2 có header "attachment".
 * GET /api/media/download?key=music/<userId>/x.mp3&name=Ten%20bai%20hat.mp3
 * (Tệp vốn công khai nên không cần đăng nhập.)
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const key = sp.get("key") ?? "";
  const parsed = parseKey(key);
  if (!parsed) return new Response("Tệp không hợp lệ", { status: 400 });

  const base = parsed.path.split("/").pop() ?? "file";
  const fallback = base.replace(/^\d+-/, "");
  const name = (sp.get("name") || fallback).replace(/[\r\n"\\/]/g, "_").slice(0, 150);

  const disposition = `attachment; filename="${name.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  try {
    const url = r2Url("GET", key, { query: { "response-content-disposition": disposition }, expires: 300 });
    return Response.redirect(url, 302);
  } catch {
    return new Response("Chưa cấu hình R2", { status: 500 });
  }
}
