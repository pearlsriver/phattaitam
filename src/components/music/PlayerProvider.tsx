"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Song } from "@/types/song";

interface PlayerState {
  current: Song | null;
  queue: Song[];
  index: number;
  radio: boolean;
  /** Tên nguồn đang phát: "Radio", tên album, tên playlist… */
  source: string | null;
  token: number;
  playSong: (song: Song, list?: Song[], source?: string) => void;
  playList: (list: Song[], source?: string) => void;
  startRadio: (list: Song[], source?: string) => void;
  next: () => void;
  prev: () => void;
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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [radio, setRadio] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [token, setToken] = useState(0);
  const bump = () => setToken((t) => t + 1);

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

  /** Radio: phát ngẫu nhiên danh sách, hết vòng tự trộn lại và phát tiếp */
  const startRadio = useCallback((list: Song[], src?: string) => {
    if (!list.length) return;
    setQueue(shuffle(list));
    setIndex(0);
    setRadio(true);
    setSource(src ?? "Radio Phật Tại Tâm");
    bump();
  }, []);

  const next = useCallback(() => {
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      bump();
    } else if (radio) {
      setQueue(shuffle(queue));
      setIndex(0);
      bump();
    }
  }, [index, queue, radio]);

  const prev = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
      bump();
    }
  }, [index]);

  const stop = useCallback(() => {
    setQueue([]);
    setIndex(0);
    setRadio(false);
    setSource(null);
  }, []);

  return (
    <PlayerContext.Provider
      value={{ current: queue[index] ?? null, queue, index, radio, source, token, playSong, playList, startRadio, next, prev, stop }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer phải dùng bên trong PlayerProvider");
  return ctx;
}
