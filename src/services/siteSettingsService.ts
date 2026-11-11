import { supabase } from "@/lib/supabase";

export async function loadSiteSettings(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw error;
  return Object.fromEntries(((data ?? []) as { key: string; value: unknown }[]).map((r) => [r.key, r.value]));
}

/** Lưu thay đổi. Giá trị null = trở về mặc định (xoá dòng cài đặt). */
export async function saveSiteSettings(changes: [string, unknown][], userId: string) {
  const now = new Date().toISOString();
  const upserts = changes
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([key, value]) => ({ key, value, updated_at: now, updated_by: userId }));
  const deletes = changes.filter(([, v]) => v === null || v === undefined).map(([k]) => k);

  if (upserts.length) {
    const { error } = await supabase.from("site_settings").upsert(upserts);
    if (error) throw error;
  }
  if (deletes.length) {
    const { error } = await supabase.from("site_settings").delete().in("key", deletes);
    if (error) throw error;
  }
}
