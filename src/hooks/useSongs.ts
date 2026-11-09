"use client";

import { listPublishedSongs } from "@/services/songService";
import type { Song } from "@/types/song";
import { useAsync } from "@/hooks/useAsync";

export function useSongs() {
  const { data, loading, error, reload } = useAsync<Song[]>(() => listPublishedSongs(), [], []);
  return { songs: data, loading, error, reload };
}
