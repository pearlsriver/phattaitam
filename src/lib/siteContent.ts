/** Nội dung trang mà Super Admin sửa được trong Chế độ chỉnh sửa (giá trị mặc định) */
export const SITE_DEFAULTS = {
  // ---- Chung ----
  "site.eyebrow": "Thư Viện Số",
  "site.name": "Phật Tại Tâm",
  "site.tagline": "Ngôi nhà cho những tâm hồn ham học hỏi",

  // ---- Trang chủ ----
  "home.heroTitle1": "Đọc. Nghe.",
  "home.heroTitle2": "Sáng tạo.",
  "home.heroDesc": "Thư viện số nơi sách, âm nhạc, ý tưởng và sáng tác của cộng đồng cùng hội tụ.",
  "home.ctaLibrary": "Khám phá thư viện →",
  "home.ctaMusic": "Mở Nhạc",
  "home.statPosts": "bài viết & sách",
  "home.statSongs": "bài nhạc",
  "home.statIdeas": "ý tưởng",
  "home.booksEyebrow": "Sách",
  "home.booksTitle": "Sách nổi bật",
  "home.booksLink": "Xem tất cả →",
  "home.booksEmpty": "Chưa có sách nào.",
  "home.musicEyebrow": "Âm nhạc",
  "home.musicTitle": "Nghe trong lúc đọc",
  "home.musicDesc": "Giai điệu cho sự chú tâm tĩnh lặng. Thiền ca, nhạc thư giãn và Radio — luôn sẵn sàng từ trình phát cố định.",
  "home.radioButton": "Phát Radio Phật Tại Tâm",
  "home.musicLink": "Mở thư viện nhạc",
  "home.albumsEyebrow": "Âm nhạc",
  "home.albumsTitle": "Album",
  "home.albumsLink": "Tất cả →",
  "home.latestEyebrow": "Thư viện",
  "home.latestTitle": "Mới đăng",
  "home.latestDesc": "Bài viết, văn thơ và suy niệm do các thành viên chia sẻ.",
  "home.latestLink": "Khám phá →",

  // ---- Trang Nhạc ----
  "music.eyebrow": "Âm nhạc",
  "music.title": "Nghe trong lúc đọc",
  "music.desc": "Nghe, tải về, xem lời, hoặc bật Radio Phật Tại Tâm — phát liên tục từ danh sách do ban quản trị tuyển chọn.",
  "music.radioButton": "Bật Radio Phật Tại Tâm",
  "music.albumsTitle": "Album & Đĩa đơn",
  "music.albumsLink": "Tất cả →",
  "music.songsTitle": "Tất cả bài hát",
  "music.empty": "Chưa có bài hát nào.",

  // ---- Trang Album ----
  "albums.eyebrow": "Âm nhạc",
  "albums.title": "Album & Đĩa đơn",
  "albums.desc": "Những tuyển tập nhạc và các đĩa đơn — nghe trọn album hoặc từng bài.",

  // ---- Thư Viện ----
  "library.eyebrow": "Thư viện",
  "library.title": "Khám phá thư viện",
  "library.desc": "Bài viết, văn thơ, kinh điển và suy niệm — lọc theo hashtag để tìm điều bạn cần.",
  "library.button": "✍️ Viết bài",

  // ---- Sách ----
  "books.eyebrow": "Sách",
  "books.title": "Sách & tài liệu",
  "books.desc": "Những tác phẩm có tệp đính kèm (PDF, EPUB, DOCX…) — đọc online hoặc tải về.",
  "books.button": "✍️ Tải sách lên",

  // ---- Chân trang ----
  "footer.title": "Phật Tại Tâm — Thư Viện Số",
  "footer.motto": "Phụng sự Phật pháp – Lan tỏa yêu thương – Chia sẻ vô cầu",
  "footer.termsLabel": "Điều lệ tham gia & chia sẻ nội dung",
  "footer.copyright": "phattaitam.com",
} as const;

export type TextKey = keyof typeof SITE_DEFAULTS;

export interface NavItem {
  href: string;
  label: string;
  visible: boolean;
}

/** Các mục menu có thể bật/tắt, đổi tên, đổi thứ tự (đường dẫn cố định) */
export const NAV_TARGETS: NavItem[] = [
  { href: "/thu-vien", label: "Thư Viện", visible: true },
  { href: "/sach", label: "Sách", visible: true },
  { href: "/nhac", label: "Nhạc", visible: true },
  { href: "/album", label: "Album", visible: false },
];

export const DEFAULT_NAV: NavItem[] = NAV_TARGETS.map((t) => ({ ...t }));

/** Chuẩn hoá menu đọc từ cơ sở dữ liệu: chỉ giữ đường dẫn hợp lệ, bổ sung mục còn thiếu */
export function normalizeNav(value: unknown): NavItem[] {
  if (!Array.isArray(value)) return DEFAULT_NAV.map((n) => ({ ...n }));
  const out: NavItem[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Partial<NavItem>;
    const target = NAV_TARGETS.find((t) => t.href === r.href);
    if (!target || out.some((o) => o.href === target.href)) continue;
    out.push({
      href: target.href,
      label: typeof r.label === "string" && r.label.trim() ? r.label.trim().slice(0, 30) : target.label,
      visible: r.visible !== false,
    });
  }
  for (const t of NAV_TARGETS) if (!out.some((o) => o.href === t.href)) out.push({ ...t });
  if (!out.some((o) => o.visible)) out[0].visible = true;
  return out;
}
