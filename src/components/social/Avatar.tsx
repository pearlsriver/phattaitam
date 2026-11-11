/* eslint-disable @next/next/no-img-element */

/**
 * Ảnh đại diện tròn. Ảnh hiển thị VỪA KHUNG, không bị cắt (giống ảnh bìa album):
 * phần thừa được lấp bằng chính ảnh đó làm mờ. Chưa có ảnh: hiện chữ cái đầu của tên.
 */
export default function Avatar({
  url,
  name,
  size = 40,
  className = "",
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const letter = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const style = { width: size, height: size, fontSize: size * 0.42 };

  if (!url) {
    return (
      <span style={style} className={`flex shrink-0 items-center justify-center rounded-full bg-accent font-serif font-semibold text-[var(--on-accent)] ${className}`}>
        {letter}
      </span>
    );
  }

  return (
    <span style={style} className={`relative block shrink-0 overflow-hidden rounded-full bg-soft ${className}`}>
      {/* Ảnh nhỏ (< 48px) không cần nền mờ cho nhẹ */}
      {size >= 48 && (
        <img src={url} alt="" aria-hidden referrerPolicy="no-referrer"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-md" />
      )}
      <img src={url} alt={name ?? ""} referrerPolicy="no-referrer" loading="lazy"
        className={`relative h-full w-full ${size >= 48 ? "object-contain" : "object-cover"}`} />
    </span>
  );
}
