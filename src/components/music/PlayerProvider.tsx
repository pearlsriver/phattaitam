"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { countSongPlay } from "@/services/socialService";
import { songAudioUrl, songCoverUrl } from "@/services/songService";
import type { Song } from "@/types/song";

export type RepeatMode = "off" | "all" | "one";

interface PlayerState {
  current: Song | null;
  queue: Song[];
  index: number;
  radio: boolean;
  /** Tên nguồn đang phát: "Radio", tên album, tên playlist… */
  source: string | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  repeat: RepeatMode;
  playSong: (song: Song, list?: Song[], source?: string) => void;
  playList: (list: Song[], source?: string) => void;
  startRadio: (list: Song[], source?: string, shuffle?: boolean) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  jumpTo: (index: number) => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleRepeat: () => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Đoán định dạng ảnh theo đuôi tệp (màn hình khoá cần biết loại ảnh) */
function imageType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/png";
}

/**
 * Ảnh cho màn hình khoá / trung tâm điều khiển (iPhone, iPad, Android, máy tính):
 * ảnh bìa bài hát → bìa album → logo Phật Tại Tâm. Phải là địa chỉ tuyệt đối.
 */
function artworkFor(song: Song): MediaImage[] {
  const origin = window.location.origin;
  const cover = songCoverUrl(song);
  if (cover) {
    const abs = cover.startsWith("http") ? cover : `${origin}${cover}`;
    const type = imageType(abs);
    return ["96x96", "192x192", "256x256", "384x384", "512x512"].map((sizes) => ({ src: abs, sizes, type }));
  }
  return [
    { src: `${origin}/logo-sm.png`, sizes: "128x128", type: "image/png" },
    { src: `${origin}/logo.png`, sizes: "512x512", type: "image/png" },
  ];
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [radio, setRadio] = useState(false);
  const [radioShuffle, setRadioShuffle] = useState(true);
  const [source, setSource] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");

  const bump = () => setToken((t) => t + 1);
  const current = queue[index] ?? null;

  /* Nhớ âm lượng & chế độ lặp */
  useEffect(() => {
    try {
      const v = parseFloat(localStorage.getItem("player:volume") ?? "");
      if (!Number.isNaN(v)) setVolumeState(Math.min(1, Math.max(0, v)));
      const r = localStorage.getItem("player:repeat");
      if (r === "all" || r === "one" || r === "off") setRepeat(r);
    } catch {}
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = volume;
      a.muted = muted;
    }
  }, [volume, muted]);

  /* Bắt đầu phát khi đổi bài */
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.src = songAudioUrl(current);
    a.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    a.play().catch(() => setPlaying(false));
    countSongPlay(current.id).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, token]);

  const playSong = useCallback((song: Song, list?: Song[], src?: string) => {
    const q = list && list.length ? list : [song];
    setQueue(q);
    setIndex(Math.max(0, q.findIndex((s) => s.id === song.id)));
    setRadio(false);
    setSource(src ?? null);
    bump();
  }, []);

  const playList = useCallback((list: Song[], src?: string) => {
    if (!list.length) return;
    setQueue(list);
    setIndex(0);
    setRadio(false);
    setSource(src ?? null);
    bump();
  }, []);

  /** Radio: phát danh sách (ngẫu nhiên hoặc theo thứ tự), hết vòng tự phát lại từ đầu */
  const startRadio = useCallback((list: Song[], src?: string, shuffleOn = true) => {
    if (!list.length) return;
    setQueue(shuffleOn ? shuffle(list) : list);
    setIndex(0);
    setRadio(true);
    setRadioShuffle(shuffleOn);
    setSource(src ?? "Radio Phật Tại Tâm");
    bump();
  }, []);

  const next = useCallback(() => {
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      bump();
    } else if (radio) {
      setQueue(radioShuffle ? shuffle(queue) : queue);
      setIndex(0);
      bump();
    } else if (repeat === "all" && queue.length) {
      setIndex(0);
      bump();
    }
  }, [index, queue, radio, radioShuffle, repeat]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    if (index > 0) {
      setIndex(index - 1);
      bump();
    } else if (a) {
      a.currentTime = 0;
    }
  }, [index]);

  const jumpTo = useCallback((i: number) => {
    setIndex(i);
    bump();
  }, []);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, [current]);

  const seek = useCallback((s: number) => {
    const a = audioRef.current;
    if (a && Number.isFinite(s)) {
      a.currentTime = Math.max(0, Math.min(s, a.duration || s));
      setCurrentTime(a.currentTime);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const x = Math.min(1, Math.max(0, v));
    setVolumeState(x);
    if (x > 0) setMuted(false);
    try { localStorage.setItem("player:volume", String(x)); } catch {}
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => {
      const n: RepeatMode = r === "off" ? "all" : r === "all" ? "one" : "off";
      try { localStorage.setItem("player:repeat", n); } catch {}
      return n;
    });
  }, []);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    setQueue([]);
    setIndex(0);
    setRadio(false);
    setSource(null);
    setPlaying(false);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  }, []);

  /* Hết bài: lặp một bài / bài kế tiếp / lặp lại danh sách / dừng */
  const onEnded = useCallback(() => {
    const a = audioRef.current;
    if (repeat === "one" && a) {
      a.currentTime = 0;
      a.play().catch(() => {});
      return;
    }
    if (index + 1 < queue.length || radio || (repeat === "all" && queue.length)) next();
    else setPlaying(false);
  }, [repeat, index, queue.length, radio, next]);

  /* ===== Màn hình khoá / tai nghe / trung tâm điều khiển ===== */
  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist ?? "Phật Tại Tâm",
      album: current.album_info?.title ?? source ?? "Phật Tại Tâm",
      artwork: artworkFor(current),
    });
  }, [current, source]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try { ms.setActionHandler(action, handler); } catch {}
    };
    set("play", () => audioRef.current?.play().catch(() => {}));
    set("pause", () => audioRef.current?.pause());
    set("nexttrack", next);
    set("previoustrack", prev);
    set("seekto", (d) => { if (typeof d.seekTime === "number") seek(d.seekTime); });
    set("seekbackward", (d) => seek((audioRef.current?.currentTime ?? 0) - (d.seekOffset || 10)));
    set("seekforward", (d) => seek((audioRef.current?.currentTime ?? 0) + (d.seekOffset || 10)));
  }, [next, prev, seek]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = current ? (playing ? "playing" : "paused") : "none";
  }, [playing, current]);

  /* Thanh thời gian trên màn hình khoá */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator) || !duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate || 1,
        position: Math.min(currentTime, duration),
      });
    } catch {}
    // Cập nhật mỗi khi đổi bài, phát/dừng hoặc tua — không cần mỗi giây
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, playing, current?.id]);

  const seekAndSync = useCallback((s: number) => {
    seek(s);
    const a = audioRef.current;
    if (a && "mediaSession" in navigator && a.duration) {
      try { navigator.mediaSession.setPositionState({ duration: a.duration, playbackRate: a.playbackRate || 1, position: a.currentTime }); } catch {}
    }
  }, [seek]);

  return (
    <PlayerContext.Provider
      value={{
        current, queue, index, radio, source, playing, currentTime, duration, volume, muted, repeat,
        playSong, playList, startRadio, togglePlay, next, prev, jumpTo, seek: seekAndSync, setVolume, toggleMute, cycleRepeat, stop,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => setPlaying(false)}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer phải dùng bên trong PlayerProvider");
  return ctx;
}
