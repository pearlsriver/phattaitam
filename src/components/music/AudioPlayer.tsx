"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/components/music/PlayerProvider";
import CoverImage from "@/components/ui/CoverImage";
import {
  CloseIcon, DownloadIcon, LinkIcon, LyricsIcon, MoreIcon, MuteIcon, NextIcon, PauseIcon,
  PlayIcon, PrevIcon, QueueIcon, RadioIcon, RepeatIcon, RepeatOneIcon, VolumeIcon,
} from "@/components/ui/Icons";
import { songCoverUrl, songDownloadUrl } from "@/services/songService";
import type { Song } from "@/types/song";

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/** Ảnh bìa vừa khung, không bị cắt: bài hát → album → logo trang web */
function Cover({ song, className, blur = false }: { song: Song; className: string; blur?: boolean }) {
  return <CoverImage src={songCoverUrl(song) ?? "/logo.png"} blur={blur} className={className} />;
}

/**
 * Trình phát cố định — kiểu kính mờ trong suốt (tham khảo Suno).
 * - Máy tính / tablet ngang: thanh phát đầy đủ ở cuối trang.
 * - Điện thoại: thanh mini; chạm vào để mở trình phát toàn màn hình.
 */
export default function AudioPlayer() {
  const {
    current, queue, index, radio, source, playing, currentTime, duration, volume, muted, repeat,
    togglePlay, next, prev, jumpTo, seek, setVolume, toggleMute, cycleRepeat, stop,
  } = usePlayer();

  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Đóng menu khi bấm ra ngoài hoặc nhấn Esc */
  useEffect(() => {
    if (!menuOpen) return;
    const down = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [menuOpen]);

  /* Khoá cuộn trang khi mở trình phát toàn màn hình */
  useEffect(() => {
    if (!expanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    document.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prevOverflow; document.removeEventListener("keydown", key); };
  }, [expanded]);

  useEffect(() => { if (!current) setExpanded(false); }, [current]);

  if (!current) return null;

  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const RepeatBtnIcon = repeat === "one" ? RepeatOneIcon : RepeatIcon;
  const repeatLabel = repeat === "off" ? "Lặp lại: tắt" : repeat === "all" ? "Lặp lại danh sách" : "Lặp lại một bài";
  const subtitle = `${current.artist ?? "Phật Tại Tâm"}${source && !radio ? ` · ${source}` : ""}`;

  const showLyrics = () => { setLyricsOpen((v) => !v); setQueueOpen(false); setMenuOpen(false); };
  const showQueue = () => { setQueueOpen((v) => !v); setLyricsOpen(false); };
  const close = () => { stop(); setMenuOpen(false); setLyricsOpen(false); setQueueOpen(false); setExpanded(false); };

  const radioBadge = radio && (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-[var(--on-accent)]">
      <RadioIcon size={10} /> RADIO
    </span>
  );

  const progress = (big = false) => (
    <div className={`flex w-full items-center gap-2 tabular-nums text-muted ${big ? "text-xs" : "text-[11px]"}`}>
      <span className={big ? "w-10" : "w-9 text-right"}>{fmt(currentTime)}</span>
      <input
        type="range"
        className="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => seek(parseFloat(e.target.value))}
        style={{ "--pct": `${pct}%` } as React.CSSProperties}
        aria-label="Tua bài hát"
      />
      <span className={big ? "w-10 text-right" : "w-9"}>{fmt(duration)}</span>
    </div>
  );

  const menu = (placement: string) => (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className={`btn-icon ${menuOpen ? "is-on" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Thêm tuỳ chọn"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreIcon size={20} />
      </button>
      {menuOpen && (
        <div role="menu" className={`glass anim-in absolute right-0 z-50 w-64 overflow-hidden rounded-2xl !bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] p-1.5 shadow-2xl ${placement}`}>
          <button role="menuitem" type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover-soft" onClick={showLyrics}>
            <LyricsIcon size={18} /> {lyricsOpen ? "Ẩn lời bài hát" : "Hiển thị lời bài hát"}
          </button>
          <Link role="menuitem" href={`/bai-hat/${current.id}`} onClick={() => { setMenuOpen(false); setExpanded(false); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink transition hover-soft">
            <LinkIcon size={18} /> Mở trang bài hát
          </Link>
          <a role="menuitem" href={songDownloadUrl(current)} onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-ink transition hover-soft">
            <DownloadIcon size={18} /> Tải về
          </a>
          <button role="menuitem" type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-ink transition hover-soft md:hidden"
            onClick={() => { toggleMute(); setMenuOpen(false); }}>
            {muted ? <VolumeIcon size={18} /> : <MuteIcon size={18} />} {muted ? "Bật tiếng" : "Tắt tiếng"}
          </button>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#ef6a6a] transition hover-soft" onClick={close}>
            <CloseIcon size={18} /> Đóng trình phát
          </button>
        </div>
      )}
    </div>
  );

  const lyricsBody = current.lyrics ? (
    <p className="whitespace-pre-wrap text-center font-serif text-lg leading-loose text-ink">{current.lyrics}</p>
  ) : (
    <p className="py-6 text-center text-muted">Bài hát này chưa có lời.</p>
  );

  const queueList = (
    <ul>
      {queue.map((s, i) => (
        <li key={`${s.id}-${i}`}>
          <button type="button" onClick={() => jumpTo(i)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover-soft ${i === index ? "row-active" : ""}`}>
            <span className="w-6 text-center text-xs text-muted">
              {i === index ? <span className="text-accent">{playing ? "▶" : "❚❚"}</span> : i + 1}
            </span>
            <Cover song={s} className="h-9 w-9 shrink-0 rounded-lg" />
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm ${i === index ? "font-semibold text-accent" : "text-ink"}`}>{s.title}</span>
              <span className="block truncate text-xs text-muted">{s.artist ?? "Phật Tại Tâm"}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* ================= ĐIỆN THOẠI: TRÌNH PHÁT TOÀN MÀN HÌNH ================= */}
      {expanded && (
        <div className="anim-sheet fixed inset-0 z-50 flex flex-col overflow-hidden bg-paper md:hidden" role="dialog" aria-modal="true" aria-label="Trình phát nhạc">
          {/* Nền mờ lấy từ ảnh bìa */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={songCoverUrl(current) ?? "/logo.png"} alt="" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-paper/40 via-paper/70 to-paper" aria-hidden />

          <div className="safe-top safe-x relative flex items-center justify-between">
            <button type="button" className="btn-icon" onClick={() => setExpanded(false)} aria-label="Thu nhỏ trình phát">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <p className="min-w-0 truncate px-2 text-center text-xs uppercase tracking-[0.2em] text-muted">
              {radio ? "Radio Phật Tại Tâm" : source ?? "Đang phát"}
            </p>
            {menu("top-12")}
          </div>

          <div className="safe-x relative flex min-h-0 flex-1 flex-col">
            {lyricsOpen || queueOpen ? (
              <div className="glass my-4 min-h-0 flex-1 overflow-y-auto rounded-3xl p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{lyricsOpen ? "Lời bài hát" : `Danh sách phát (${queue.length})`}</p>
                  <button type="button" className="btn-icon" onClick={() => { setLyricsOpen(false); setQueueOpen(false); }} aria-label="Đóng"><CloseIcon size={18} /></button>
                </div>
                {lyricsOpen ? lyricsBody : queueList}
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 items-center justify-center py-6">
                <Cover song={current} blur className={`aspect-square w-full max-w-[22rem] rounded-3xl shadow-2xl transition duration-500 ${playing ? "scale-100" : "scale-[0.92] opacity-90"}`} />
              </div>
            )}

            <div className="space-y-4 pb-2">
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-2xl font-semibold text-ink">{current.title}</p>
                  <p className="flex items-center gap-2 truncate text-sm text-muted">{radioBadge}<span className="truncate">{subtitle}</span></p>
                </div>
                <button type="button" className={`btn-icon ${lyricsOpen ? "is-on" : ""}`} onClick={showLyrics} aria-label="Hiển thị lời bài hát" aria-pressed={lyricsOpen}>
                  <LyricsIcon size={20} />
                </button>
              </div>

              {progress(true)}

              <div className="flex items-center justify-between">
                <button type="button" className={`btn-icon !h-12 !w-12 ${repeat !== "off" ? "is-on" : ""}`} onClick={cycleRepeat} aria-label={repeatLabel} aria-pressed={repeat !== "off"}>
                  <RepeatBtnIcon size={22} />
                </button>
                <button type="button" className="btn-icon !h-14 !w-14" onClick={prev} aria-label="Bài trước"><PrevIcon size={30} /></button>
                <button type="button" onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"} className="btn-primary flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full">
                  {playing ? <PauseIcon size={34} /> : <PlayIcon size={34} />}
                </button>
                <button type="button" className="btn-icon !h-14 !w-14" onClick={next} aria-label="Bài tiếp"><NextIcon size={30} /></button>
                <button type="button" className={`btn-icon !h-12 !w-12 ${queueOpen ? "is-on" : ""}`} onClick={showQueue} aria-label="Danh sách phát" aria-pressed={queueOpen}>
                  <QueueIcon size={22} />
                </button>
              </div>
            </div>
          </div>
          <div className="safe-bottom" />
        </div>
      )}

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-2 sm:px-4 md:pb-4">
        {/* ===== Máy tính: Lời bài hát / Hàng đợi ===== */}
        {lyricsOpen && !expanded && (
          <div className="glass anim-in mx-auto mb-2 hidden max-h-[55vh] max-w-5xl overflow-y-auto rounded-3xl p-6 shadow-2xl md:block">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Lời bài hát</p>
                <p className="font-serif text-xl font-semibold text-ink">{current.title}</p>
              </div>
              <button type="button" className="btn-icon" onClick={() => setLyricsOpen(false)} aria-label="Đóng lời bài hát"><CloseIcon size={18} /></button>
            </div>
            {lyricsBody}
          </div>
        )}
        {queueOpen && !expanded && (
          <div className="glass anim-in mx-auto mb-2 hidden max-h-[50vh] max-w-5xl overflow-y-auto rounded-3xl p-3 shadow-2xl md:block">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-ink">
                {radio ? "Radio — sắp phát" : "Danh sách phát"} <span className="font-normal text-muted">({queue.length} bài)</span>
              </p>
              <button type="button" className="btn-icon" onClick={() => setQueueOpen(false)} aria-label="Đóng danh sách"><CloseIcon size={18} /></button>
            </div>
            {queueList}
          </div>
        )}

        {/* ================= ĐIỆN THOẠI: THANH MINI ================= */}
        <div className="glass relative mx-auto overflow-hidden rounded-2xl shadow-2xl md:hidden">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-[color-mix(in_srgb,var(--ink)_12%,transparent)]" aria-hidden>
            <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-2 py-2 pl-2 pr-1">
            <button type="button" onClick={() => setExpanded(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Mở trình phát toàn màn hình">
              <Cover song={current} className="h-11 w-11 shrink-0 rounded-xl" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{current.title}</span>
                <span className="flex items-center gap-1.5 truncate text-xs text-muted">{radioBadge}<span className="truncate">{subtitle}</span></span>
              </span>
            </button>
            <button type="button" onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"} className="btn-icon !h-11 !w-11 text-ink">
              {playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
            </button>
            <button type="button" onClick={next} aria-label="Bài tiếp" className="btn-icon !h-11 !w-11"><NextIcon size={22} /></button>
          </div>
        </div>

        {/* ================= MÁY TÍNH: THANH PHÁT ĐẦY ĐỦ ================= */}
        <div className="glass mx-auto hidden max-w-5xl rounded-3xl px-5 pb-2 pt-2.5 shadow-2xl md:block">
          <div className="grid grid-cols-[1fr_minmax(0,1.5fr)_1fr] items-center gap-x-3">
            <div className="flex min-w-0 items-center gap-3">
              <Cover song={current} className={`h-14 w-14 shrink-0 rounded-xl ${playing ? "" : "opacity-80"}`} />
              <div className="min-w-0">
                <Link href={`/bai-hat/${current.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">{current.title}</Link>
                <p className="flex items-center gap-1.5 truncate text-xs text-muted">{radioBadge}<span className="truncate">{subtitle}</span></p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <button type="button" className={`btn-icon ${repeat !== "off" ? "is-on" : ""}`} onClick={cycleRepeat} aria-label={repeatLabel} title={repeatLabel} aria-pressed={repeat !== "off"}>
                  <RepeatBtnIcon size={18} />
                </button>
                <button type="button" className="btn-icon" onClick={prev} aria-label="Bài trước"><PrevIcon size={20} /></button>
                <button type="button" onClick={togglePlay} aria-label={playing ? "Tạm dừng" : "Phát"} className="btn-primary flex h-11 w-11 items-center justify-center rounded-full">
                  {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
                </button>
                <button type="button" className="btn-icon" onClick={next} aria-label="Bài tiếp"><NextIcon size={20} /></button>
                <button type="button" className={`btn-icon ${queueOpen ? "is-on" : ""}`} onClick={showQueue} aria-label="Danh sách phát" title="Danh sách phát" aria-pressed={queueOpen}>
                  <QueueIcon size={18} />
                </button>
              </div>
              {progress()}
            </div>

            <div className="flex items-center justify-end gap-1">
              <button type="button" className="btn-icon" onClick={toggleMute} aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}>
                {muted || volume === 0 ? <MuteIcon size={18} /> : <VolumeIcon size={18} />}
              </button>
              <input
                type="range"
                className="range !w-24"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ "--pct": `${volPct}%` } as React.CSSProperties}
                aria-label="Âm lượng"
              />
              {!expanded && menu("bottom-12")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
