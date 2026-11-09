"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import { usePlayer } from "@/components/music/PlayerProvider";
import { RadioIcon } from "@/components/ui/Icons";
import { listAlbums } from "@/services/albumService";
import { getRadioSettings, listRadioSongs, saveRadioSettings, saveRadioSongs } from "@/services/radioService";
import { listPublishedSongs, songCoverUrl } from "@/services/songService";
import type { Album } from "@/types/album";
import type { Song } from "@/types/song";
import { matchSearch } from "@/utils/slug";

function RadioAdmin() {
  const { startRadio } = usePlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [mode, setMode] = useState<"all" | "custom">("all");
  const [shuffle, setShuffle] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [albumPick, setAlbumPick] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([listPublishedSongs(), listAlbums(), getRadioSettings(), listRadioSongs().catch(() => [] as Song[])])
      .then(([s, a, st, chosen]) => {
        setSongs(s);
        setAlbums(a);
        setMode(st.mode);
        setShuffle(st.shuffle);
        setSelected(chosen.map((x) => x.id));
      })
      .catch((e) => setMsg({ ok: false, text: e instanceof Error ? e.message : "Không tải được dữ liệu" }))
      .finally(() => setLoading(false));
  }, []);

  const byId = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const chosen = selected.map((id) => byId.get(id)).filter((s): s is Song => !!s);
  const available = songs.filter((s) => !selected.includes(s.id) && matchSearch(`${s.title} ${s.artist ?? ""} ${s.album_info?.title ?? ""}`, q));

  const add = (ids: string[]) => setSelected((cur) => [...cur, ...ids.filter((id) => !cur.includes(id))]);
  const remove = (id: string) => setSelected((cur) => cur.filter((x) => x !== id));
  const move = (i: number, d: -1 | 1) =>
    setSelected((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function save() {
    if (mode === "custom" && !selected.length) {
      return setMsg({ ok: false, text: "Chế độ “danh sách tuỳ chọn” cần ít nhất 1 bài. Hãy thêm bài vào danh sách Radio." });
    }
    setBusy(true);
    setMsg(null);
    try {
      await saveRadioSongs(selected);
      await saveRadioSettings({ mode, shuffle });
      setMsg({ ok: true, text: "Đã lưu cấu hình Radio." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Không lưu được" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-muted">Đang tải…</p>;

  const modeCard = (value: "all" | "custom", title: string, desc: string) => (
    <button type="button" onClick={() => setMode(value)} aria-pressed={mode === value}
      className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${mode === value ? "border-accent bg-accent-soft" : "border-line bg-surface hover:border-accent/50"}`}>
      <p className="font-semibold text-ink">{mode === value ? "● " : "○ "}{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{desc}</p>
    </button>
  );

  return (
    <div>
      <Link href="/admin" className="text-sm text-accent hover:underline">← Quản trị</Link>
      <h1 className="mt-3 font-serif text-4xl font-semibold text-ink">Quản lý Radio</h1>
      <p className="mt-2 text-ink-soft">Chọn những bài hát sẽ phát khi người nghe bấm “Bật Radio” trên trang chủ và trang Nhạc.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {modeCard("all", "Toàn bộ thư viện", "Phát mọi bài hát đã đăng. Bài mới tự động vào Radio.")}
        {modeCard("custom", "Danh sách do quản trị chọn", "Chỉ phát những bài trong danh sách bên dưới, theo thứ tự bạn sắp xếp.")}
      </div>

      <label className="mt-5 flex items-center gap-3 text-ink">
        <input type="checkbox" checked={shuffle} onChange={(e) => setShuffle(e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
        <span>Phát ngẫu nhiên <span className="text-sm text-muted">(tắt = phát đúng thứ tự, hết vòng tự lặp lại từ đầu)</span></span>
      </label>

      <div className={`mt-8 grid gap-6 lg:grid-cols-2 ${mode === "all" ? "opacity-50" : ""}`}>
        {/* Cột trái: tất cả bài hát */}
        <section className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-serif text-xl font-semibold text-ink">Thư viện nhạc ({available.length})</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Tìm bài hát, ca sĩ, album…" className="field mt-3 !rounded-full" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary !py-1.5" onClick={() => add(available.map((s) => s.id))} disabled={!available.length}>＋ Thêm tất cả đang hiện</button>
            <select value={albumPick} onChange={(e) => setAlbumPick(e.target.value)} className="field !w-auto !rounded-full !py-1.5 text-sm">
              <option value="">Thêm cả album…</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            <button type="button" className="btn btn-secondary !py-1.5" disabled={!albumPick}
              onClick={() => { add(songs.filter((s) => s.album_id === albumPick).map((s) => s.id)); setAlbumPick(""); }}>Thêm</button>
          </div>
          <ul className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto pr-1">
            {available.map((s) => (
              <li key={s.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-soft">
                <Thumb song={s} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                  <p className="truncate text-xs text-muted">{s.artist ?? "—"}{s.album_info ? ` · ${s.album_info.title}` : ""}</p>
                </div>
                <button type="button" className="btn btn-secondary !px-3 !py-1" onClick={() => add([s.id])} aria-label={`Thêm ${s.title}`}>＋</button>
              </li>
            ))}
            {!available.length && <li className="p-3 text-sm text-muted">Không còn bài nào để thêm.</li>}
          </ul>
        </section>

        {/* Cột phải: danh sách Radio */}
        <section className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-ink">Danh sách Radio ({chosen.length})</h2>
            <button type="button" className="btn btn-danger !py-1" disabled={!selected.length} onClick={() => confirm("Bỏ hết bài khỏi danh sách Radio?") && setSelected([])}>Bỏ hết</button>
          </div>
          <ol className="mt-3 max-h-[32rem] space-y-1 overflow-y-auto pr-1">
            {chosen.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2 rounded-xl p-2 hover:bg-soft">
                <span className="w-6 text-center text-xs text-muted">{i + 1}</span>
                <Thumb song={s} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                  <p className="truncate text-xs text-muted">{s.artist ?? "—"}</p>
                </div>
                <button type="button" className="btn-icon !h-8 !w-8" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Lên">↑</button>
                <button type="button" className="btn-icon !h-8 !w-8" onClick={() => move(i, 1)} disabled={i === chosen.length - 1} aria-label="Xuống">↓</button>
                <button type="button" className="btn-icon !h-8 !w-8 text-[#ef6a6a]" onClick={() => remove(s.id)} aria-label="Bỏ">✕</button>
              </li>
            ))}
            {!chosen.length && <li className="p-3 text-sm text-muted">Chưa có bài nào. Thêm bài từ cột bên trái.</li>}
          </ol>
        </section>
      </div>

      {msg && <p className={`mt-6 ${msg.ok ? "text-green-500" : "text-red-500"}`}>{msg.text}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary !px-7 !py-3" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu cấu hình Radio"}</button>
        <button type="button" className="btn btn-secondary !py-3" disabled={mode === "custom" ? !chosen.length : !songs.length}
          onClick={() => startRadio(mode === "custom" ? chosen : songs, "Radio Phật Tại Tâm (nghe thử)", shuffle)}>
          <RadioIcon size={18} /> Nghe thử
        </button>
      </div>
    </div>
  );
}

function Thumb({ song }: { song: Song }) {
  const cover = songCoverUrl(song);
  return cover ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cover} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft">🎵</span>
  );
}

export default function RadioAdminPage() {
  return <RequireAuth admin><RadioAdmin /></RequireAuth>;
}
