import { supabase } from "@/lib/supabase";
import { listPublishedSongs, singleLabel } from "@/services/songService";
import type { Song } from "@/types/song";

export interface RadioSettings {
  mode: "all" | "custom";
  shuffle: boolean;
}

const DEFAULTS: RadioSettings = { mode: "all", shuffle: true };

export async function getRadioSettings(): Promise<RadioSettings> {
  const { data, error } = await supabase.from("radio_settings").select("mode, shuffle").eq("id", 1).maybeSingle();
  if (error || !data) return DEFAULTS;
  return { mode: data.mode === "custom" ? "custom" : "all", shuffle: !!data.shuffle };
}

export async function saveRadioSettings(s: RadioSettings) {
  const { error } = await supabase.from("radio_settings")
    .upsert({ id: 1, mode: s.mode, shuffle: s.shuffle, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/** Danh sách bài do quản trị viên chọn, theo thứ tự (chỉ bài đã đăng) */
export async function listRadioSongs(): Promise<Song[]> {
  const { data, error } = await supabase.from("radio_songs")
    .select("position, song:songs(*, album_info:albums(id, title, cover_path, is_solo))")
    .order("position", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as { song: Song | Song[] | null }[])
    .map((r) => (Array.isArray(r.song) ? r.song[0] : r.song))
    .filter((s): s is Song => !!s && s.is_published)
    .map(singleLabel);
}

/** Lưu toàn bộ danh sách radio (thay thế danh sách cũ) */
export async function saveRadioSongs(songIds: string[]) {
  const del = await supabase.from("radio_songs").delete().neq("song_id", "00000000-0000-0000-0000-000000000000");
  if (del.error) throw del.error;
  if (!songIds.length) return;
  const { error } = await supabase.from("radio_songs")
    .insert(songIds.map((song_id, position) => ({ song_id, position })));
  if (error) throw error;
}

/** Hàng đợi Radio theo cấu hình của quản trị viên (nếu danh sách trống thì dùng toàn bộ thư viện) */
export async function loadRadioQueue(): Promise<{ songs: Song[]; shuffle: boolean }> {
  const settings = await getRadioSettings();
  if (settings.mode === "custom") {
    const chosen = await listRadioSongs().catch(() => []);
    if (chosen.length) return { songs: chosen, shuffle: settings.shuffle };
  }
  return { songs: await listPublishedSongs(), shuffle: settings.shuffle };
}
