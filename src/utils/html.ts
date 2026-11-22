import DOMPurify from "dompurify";

/** Bài cũ là văn bản thuần; bài mới (trình soạn thảo) là HTML */
export function isHtml(content: string): boolean {
  return /^\s*<(p|h2|h3|ul|ol|blockquote|div|img|figure|b|strong|i|em|br|hr)[\s>/]/i.test(content);
}

/** Bỏ thẻ HTML để làm đoạn trích / mô tả SEO (chạy được cả server và client) */
export function stripHtml(content: string): string {
  return content
    .replace(/<(br|\/p|\/h2|\/h3|\/li|\/blockquote)\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function plainExcerpt(content: string, max = 200): string {
  const text = stripHtml(content).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Ảnh đầu tiên trong bài (dùng làm ảnh chia sẻ) */
export function firstImage(content: string): string | null {
  const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "s", "h2", "h3", "blockquote",
  "ul", "ol", "li", "hr", "div", "span", "figure", "figcaption", "a", "img",
];
const ALLOWED_ATTR = ["href", "src", "alt", "target", "rel", "loading"];

function safeUrl(url: string, forImg: boolean): boolean {
  const u = url.trim().toLowerCase();
  if (forImg) return u.startsWith("https://") || u.startsWith("http://");
  return u.startsWith("https://") || u.startsWith("http://") || u.startsWith("mailto:") || u.startsWith("/");
}

let hooked = false;

/**
 * Lọc HTML bằng DOMPurify (thư viện chống XSS chuyên dụng): chỉ giữ thẻ/thuộc tính an toàn,
 * liên kết mở tab mới, ảnh chỉ nhận http(s). Chỉ chạy ở trình duyệt.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return "";
  if (!hooked) {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      const el = node as Element;
      if (el.tagName === "A") {
        const href = el.getAttribute("href") ?? "";
        if (!safeUrl(href, false)) el.removeAttribute("href");
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer nofollow");
      } else if (el.tagName === "IMG") {
        const src = el.getAttribute("src") ?? "";
        if (!safeUrl(src, true)) el.removeAttribute("src");
        el.setAttribute("loading", "lazy");
      }
    });
    hooked = true;
  }
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
  }) as string;
}

/** Đổi văn bản thuần (bài cũ) thành HTML để mở trong trình soạn thảo */
export function textToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${esc(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
