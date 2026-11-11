/** Đọc thời lượng (giây) của tệp nhạc hoặc địa chỉ nhạc. Trả về null nếu không đọc được. */
export function readAudioDuration(src: File | string, timeoutMs = 20000): Promise<number | null> {
  return new Promise((resolve) => {
    const url = typeof src === "string" ? src : URL.createObjectURL(src);
    const a = new Audio();
    let done = false;
    const finish = (v: number | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      a.removeAttribute("src");
      a.load();
      if (typeof src !== "string") URL.revokeObjectURL(url);
      resolve(v);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    a.preload = "metadata";
    a.addEventListener("loadedmetadata", () => {
      const d = a.duration;
      finish(Number.isFinite(d) && d > 0 ? d : null);
    });
    a.addEventListener("error", () => finish(null));
    a.src = url;
  });
}
