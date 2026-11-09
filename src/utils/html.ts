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

const ALLOWED: Record<string, string[]> = {
  P: [], BR: [], B: [], STRONG: [], I: [], EM: [], U: [], S: [], H2: [], H3: [],
  BLOCKQUOTE: [], UL: [], OL: [], LI: [], HR: [], DIV: [], SPAN: [], FIGURE: [], FIGCAPTION: [],
  A: ["href"],
  IMG: ["src", "alt"],
};

function safeUrl(url: string, forImg: boolean): boolean {
  const u = url.trim().toLowerCase();
  if (forImg) return u.startsWith("https://") || u.startsWith("http://");
  return u.startsWith("https://") || u.startsWith("http://") || u.startsWith("mailto:") || u.startsWith("/");
}

/** Lọc HTML: chỉ giữ thẻ/thuộc tính an toàn (chống mã độc XSS). Chỉ chạy ở trình duyệt. */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(`<div>${dirty}</div>`, "text/html");
  const root = doc.body.firstElementChild as HTMLElement;

  const walk = (node: Element) => {
    Array.from(node.children).forEach((el) => {
      const allowed = ALLOWED[el.tagName];
      if (!allowed) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "INPUT", "BUTTON"].includes(el.tagName)) {
          el.remove();
        } else {
          walk(el);
          el.replaceWith(...Array.from(el.childNodes));
        }
        return;
      }
      Array.from(el.attributes).forEach((attr) => {
        if (!allowed.includes(attr.name)) el.removeAttribute(attr.name);
      });
      if (el.tagName === "A") {
        const href = el.getAttribute("href") ?? "";
        if (!safeUrl(href, false)) el.removeAttribute("href");
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer nofollow");
      }
      if (el.tagName === "IMG") {
        const src = el.getAttribute("src") ?? "";
        if (!safeUrl(src, true)) el.remove();
        else el.setAttribute("loading", "lazy");
      }
      walk(el);
    });
  };
  walk(root);
  return root.innerHTML;
}

/** Đổi văn bản thuần (bài cũ) thành HTML để mở trong trình soạn thảo */
export function textToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${esc(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
