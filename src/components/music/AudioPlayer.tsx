"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/components/music/PlayerProvider";
import { countSongPlay } from "@/services/socialService";
import { songAudioUrl, songCoverUrl } from "@/services/songService";

/** Trình phát cố định cuối trang — tiếp tục phát khi chuyển trang */
export default function AudioPlayer() {
  const { current, radio, source, token, next, prev, stop, queue, index } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showLyrics, setShowLyrics] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.src = songAudioUrl(current);
    a.play().catch(() => {});
    countSongPlay(current.id).catch(() => {});
  }, [current, token]);

  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const cover = songCoverUrl(current);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist ?? "Phật Tại Tâm",
      album: current.album_info?.title ?? source ?? "",
      artwork: cover ? [{ src: cover, sizes: "512x512" }] : [],
    });
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("previoustrack", prev);
  }, [current, source, next, prev]);

  if (!current) return null;
  const cover = songCoverUrl(current);
  const btn = "flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-soft";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
      {showLyrics && (
        <div className="mx-auto mb-2 max-h-[50vh] max-w-5xl overflow-y-auto rounded-2xl border border-line bg-surface/95 p-5 shadow-2xl backdrop-blur">
          <p className="mb-3 font-serif text-lg font-semibold text-ink">{current.title}</p>
          {current.lyrics ? (
            <p className="whitespace-pre-wrap font-serif leading-relaxed text-ink-soft">{current.lyrics}</p>
          ) : (
            <p className="text-sm text-muted">Bài hát này chưa có lời.</p>
          )}
        </div>
      )}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface/95 px-4 py-2.5 shadow-2xl backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="h-11 w-11 rounded-lg object-cover" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft">🎵</div>
          )}
          <div className="min-w-0">
            <Link href={`/bai-hat/${current.id}`} className="block truncate text-sm font-medium text-ink hover:underline">
              {current.title}
            </Link>
            <p className="truncate text-xs text-muted">
              {radio && <span className="mr-1.5 rounded bg-accent px-1.5 py-px text-[10px] font-semibold text-paper">RADIO</span>}
              {current.artist ?? "Phật Tại Tâm"}
              {source && ` · ${source}`} · {index + 1}/{queue.length}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <button type="button" onClick={() => setShowLyrics(!showLyrics)} className={`${btn} text-xs font-semibold ${showLyrics ? "bg-soft" : ""}`} aria-label="Lời bài hát" title="Lời bài hát">
            Lời
          </button>
          <button type="button" onClick={prev} className={btn} aria-label="Bài trước">⏮</button>
          <button type="button" onClick={next} className={btn} aria-label="Bài tiếp">⏭</button>
          <button type="button" onClick={stop} className={btn} aria-label="Tắt">✕</button>
        </div>
        <audio ref={audioRef} controls onEnded={next} className="h-9 w-full md:w-80" />
      </div>
    </div>
  );
}
