import { createClient } from "@supabase/supabase-js";

export interface AuthInfo {
  userId: string;
  isAdmin: boolean;
}

/** Xác thực người gọi API bằng access token của Supabase (header Authorization: Bearer …) */
export async function authUser(req: Request): Promise<AuthInfo | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = profile?.role;
  return { userId: data.user.id, isAdmin: role === "admin" || role === "super_admin" };
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
