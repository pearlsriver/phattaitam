"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/components/music/PlayerProvider";
import {
  CloseIcon, DownloadIcon, LinkIcon, LyricsIcon, MoreIcon, MuteIcon, MusicNoteIcon, NextIcon, PauseIcon,
  PlayIcon, PrevIcon, QueueIcon, RadioIcon, RepeatIcon, RepeatOneIcon, VolumeIcon,
} from "@/components/ui/Icons";
import { songCoverUrl, songDownloadUrl } from "@/services/songService";

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

/**
 * Trình phát cố định cuối trang — kiểu kính mờ trong suốt (tham khảo Suno).
 * Tiếp tục phát khi chuyển trang. Menu ⋯ chứa: Hiển thị lời bài hát, tải về…
 */
export default function AudioPlayer() {
  const {
    current, queue, index, radio, source, playing, currentTime, duration, volume, muted, repeat,
    togglePlay, next, prev, jumpTo, seek, setVolume, toggleMute, cycleRepeat, stop,
  } = usePlayer();

  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  /* Đóng menu khi bấm ra ngoài hoặc nhấn Esc */
  useEffect(() => {
    if (!menuOpen) return;
    const down = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [menuOpen]);

  if (!current) return null;

  const cover = songCoverUrl(current);
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const volPct = (muted ? 0 : volume) * 100;
  const RepeatBtnIcon = repeat === "one" ? RepeatOneIcon : RepeatIcon;
  const repeatLabel = repeat === "off" ? "Lặp lại: tắt" : repeat === "all" ? "Lặp lại danh sách" : "Lặp lại một bài";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-2 sm:px-4 sm:pb-4">
      {/* ===== Lời bài hát ===== */}
      {lyricsOpen && (
        <div className="glass anim-in mx-auto mb-2 max-h-[55vh] max-w-5xl overflow-y-auto rounded-3xl p-6 shadow-2xl">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Lời bài hát</p>
              <p className="font-serif text-xl font-semibold text-ink">{current.title}</p>
            </div>
            <button type="button" className="btn-icon" onClick={() => setLyricsOpen(false)} aria-label="Đóng lời bài hát">
              <CloseIcon size={18} />
            </button>
          </div>
          {current.lyrics ? (
            <p className="whitespace-pre-wrap text-center font-serif text-lg leading-loose text-ink">{current.lyrics}</p>
          ) : (
            <p className="py-6 text-center text-muted">Bài hát này chưa có lời.</p>
          )}
        </div>
      )}

      {/* ===== Hàng đợi ===== */}
      {queueOpen && (
        <div className="glass anim-in mx-auto mb-2 max-h-[50vh] max-w-5xl overflow-y-auto rounded-3xl p-3 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-sm font-semibold text-ink">
              {radio ? "Radio — sắp phát" : "Danh sách phát"} <span className="font-normal text-muted">({queue.length} bài)</span>
            </p>
            <button type="button" className="btn-icon" onClick={() => setQueueOpen(false)} aria-label="Đóng danh sách"><CloseIcon size={18} /></button>
          </div>
          <ul>
            {queue.map((s, i) => (
              <li key={`${s.id}-${i}`}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover-soft ${i === index ? "row-active" : ""}`}
                >
                  <span className="w-6 text-center text-xs text-muted">
                    {i === index ? <span className="text-accent">{playing ? "▶" : "❚❚"}</span> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${i === index ? "font-semibold text-accent" : "text-ink"}`}>{s.title}</span>
                    <span className="block truncate text-xs text-muted">{s.artist ?? "Phật Tại Tâm"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ===== Thanh phát ===== */}
      <div className="glass mx-auto max-w-5xl rounded-3xl px-3 pb-2 pt-2.5 shadow-2xl sm:px-5">
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 md:grid-cols-[1fr_minmax(0,1.5fr)_1fr]">
          {/* Trái: ảnh + tên bài */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-accent-soft sm:h-14 sm:w-14">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className={`h-full w-full object-cover ${playing ? "" : "opacity-80"}`} />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-accent"><MusicNoteIcon size={22} /></span>
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/bai-hat/${current.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">{current.title}</Link>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted">
                {radio && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent px-1.5 py-px text-[10px] font-bold text-[var(--on-accent)]">
                    <RadioIcon size={10} /> RADIO
                  </span>
                )}
                <span className="truncate">{current.artist ?? "Phật Tại Tâm"}{source && !radio ? ` · ${source}` : ""}</span>
              </p>
            </div>
          </div>

          {/* Giữa: điều khiển + tiến trình */}
          <div className="order-3 col-span-2 flex flex-col items-center gap-1 md:order-none md:col-span-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <button type="button" className={`btn-icon ${repeat !== "off" ? "is-on" : ""}`} onClick={cycleRepeat} aria-label={repeatLabel} title={repeatLabel} aria-pressed={repeat !== "off"}>
                <RepeatBtnIcon size={18} />
              </button>
              <button type="button" className="btn-icon" onClick={prev} aria-label="Bài trước"><PrevIcon size={20} /></button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Tạm dừng" : "Phát"}
                className="btn-primary flex h-11 w-11 items-center justify-center rounded-full"
              >
                {playing ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
              </button>
              <button type="button" className="btn-icon" onClick={next} aria-label="Bài tiếp"><NextIcon size={20} /></button>
              <button type="button" className={`btn-icon ${queueOpen ? "is-on" : ""}`} onClick={() => setQueueOpen((v) => !v)} aria-label="Danh sách phát" title="Danh sách phát" aria-pressed={queueOpen}>
                <QueueIcon size={18} />
              </button>
            </div>
            <div className="flex w-full items-center gap-2 text-[11px] tabular-nums text-muted">
              <span className="w-9 text-right">{fmt(currentTime)}</span>
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
              <span className="w-9">{fmt(duration)}</span>
            </div>
          </div>

          {/* Phải: âm lượng + menu ⋯ */}
          <div className="flex items-center justify-end gap-1">
            <div className="hidden items-center gap-1 md:flex">
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
            </div>

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
                <div role="menu" className="glass anim-in absolute bottom-12 right-0 z-50 w-64 overflow-hidden rounded-2xl p-1.5 shadow-2xl">
                  <button
                    role="menuitem"
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover-soft"
                    onClick={() => { setLyricsOpen((v) => !v); setQueueOpen(false); setMenuOpen(false); }}
                  >
                    <LyricsIcon size={18} />
                    {lyricsOpen ? "Ẩn lời bài hát" : "Hiển thị lời bài hát"}
                  </button>
                  <Link
                    role="menuitem"
                    href={`/bai-hat/${current.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover-soft"
                  >
                    <LinkIcon size={18} /> Mở trang bài hát
                  </Link>
                  <a
                    role="menuitem"
                    href={songDownloadUrl(current)}
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition hover-soft"
                  >
                    <DownloadIcon size={18} /> Tải về
                  </a>
                  <div className="my-1 h-px bg-line md:hidden" />
                  <button
                    role="menuitem"
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition hover-soft md:hidden"
                    onClick={() => { toggleMute(); setMenuOpen(false); }}
                  >
                    {muted ? <VolumeIcon size={18} /> : <MuteIcon size={18} />} {muted ? "Bật tiếng" : "Tắt tiếng"}
                  </button>
                  <div className="my-1 h-px bg-line" />
                  <button
                    role="menuitem"
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[#ef6a6a] transition hover-soft"
                    onClick={() => { stop(); setMenuOpen(false); setLyricsOpen(false); setQueueOpen(false); }}
                  >
                    <CloseIcon size={18} /> Đóng trình phát
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
