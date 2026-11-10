/**
 * Tự nén ảnh trước khi tải lên (chạy ngay trong trình duyệt, không cần máy chủ).
 *
 * - Ảnh nhỏ gọn sẵn (≤ ~1 MB và không quá lớn về kích thước) được GIỮ NGUYÊN, không nén lại.
 * - Ảnh lớn: thu nhỏ về tối đa `maxDimension` px ở cạnh dài và giảm chất lượng dần
 *   cho đến khi dung lượng ≤ `maxBytes` (mặc định ~1 MB). Tỉ lệ ảnh luôn được giữ nguyên.
 * - Ảnh có nền trong suốt (PNG/WebP) được giữ độ trong suốt; ảnh thường chuyển sang JPEG.
 * - Ảnh GIF / SVG hoặc ảnh không đọc được: giữ nguyên.
 */
export interface CompressOptions {
  /** Dung lượng tối đa mong muốn (byte). Mặc định ~1 MB. */
  maxBytes?: number;
  /** Cạnh dài tối đa (px). Mặc định 1800. */
  maxDimension?: number;
}

export interface CompressResult {
  file: File;
  originalSize: number;
  /** true nếu ảnh đã được nén / thu nhỏ */
  compressed: boolean;
  width: number;
  height: number;
}

export const IMAGE_MAX_BYTES = 1_000_000;
export const IMAGE_MAX_DIMENSION = 1800;
/** Dung lượng ảnh gốc tối đa cho phép chọn (trước khi nén) */
export const IMAGE_MAX_INPUT_BYTES = 40 * 1024 * 1024;

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
}

async function decode(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* thử cách dự phòng bên dưới */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

/** Kiểm tra ảnh có điểm trong suốt không (lấy mẫu trên bản thu nhỏ 48px) */
function hasTransparency(source: CanvasImageSource, w: number, h: number): boolean {
  try {
    const s = Math.min(1, 48 / Math.max(w, h));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w * s));
    c.height = Math.max(1, Math.round(h * s));
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;
    ctx.drawImage(source, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  } catch {
    /* bỏ qua */
  }
  return false;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

const QUALITIES = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<CompressResult> {
  const maxBytes = opts.maxBytes ?? IMAGE_MAX_BYTES;
  const maxDim = opts.maxDimension ?? IMAGE_MAX_DIMENSION;
  const same: CompressResult = { file, originalSize: file.size, compressed: false, width: 0, height: 0 };

  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return same;

  let dec: Decoded;
  try {
    dec = await decode(file);
  } catch {
    return same; // định dạng trình duyệt không đọc được (ví dụ HEIC) — giữ nguyên
  }

  try {
    const { width: w0, height: h0 } = dec;
    if (!w0 || !h0) return same;

    let scale = Math.min(1, maxDim / Math.max(w0, h0));
    if (scale === 1 && file.size <= maxBytes) return { ...same, width: w0, height: h0 };

    const alpha = /png|webp/.test(file.type) && hasTransparency(dec.source, w0, h0);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return same;
    ctx.imageSmoothingQuality = "high";

    let outType = alpha ? "image/webp" : "image/jpeg";
    let best: Blob | null = null;
    let bw = w0;
    let bh = h0;

    for (let attempt = 0; attempt < 8; attempt++) {
      const w = Math.max(1, Math.round(w0 * scale));
      const h = Math.max(1, Math.round(h0 * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(dec.source, 0, 0, w, h);

      for (const q of QUALITIES) {
        let blob = await toBlob(canvas, outType, q);
        if (!blob) continue;
        // Trình duyệt cũ (Safari) không nén được WebP → dùng PNG (chỉ thu nhỏ kích thước để giảm dung lượng)
        if (outType === "image/webp" && blob.type !== "image/webp") {
          outType = "image/png";
          blob = await toBlob(canvas, "image/png");
          if (!blob) break;
        }
        best = blob;
        bw = w;
        bh = h;
        if (blob.size <= maxBytes || outType === "image/png") break;
      }
      if (best && best.size <= maxBytes) break;
      scale *= 0.82;
    }

    if (!best) return same;
    // Ảnh gốc đã nhỏ gọn hơn bản nén → giữ nguyên
    if (file.size <= maxBytes && best.size >= file.size) return { ...same, width: w0, height: h0 };

    const ext = best.type === "image/webp" ? "webp" : best.type === "image/png" ? "png" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const out = new File([best], `${base}.${ext}`, { type: best.type, lastModified: Date.now() });
    return { file: out, originalSize: file.size, compressed: true, width: bw, height: bh };
  } finally {
    dec.close();
  }
}

export function formatFileSize(n: number): string {
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}
