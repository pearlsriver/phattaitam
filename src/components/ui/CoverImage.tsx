/* eslint-disable @next/next/no-img-element */

/**
 * Hiển thị ảnh bìa VỪA KHUNG, KHÔNG BỊ CẮT (object-contain).
 * Nếu tỉ lệ ảnh khác tỉ lệ khung, phần thừa được lấp bằng chính ảnh đó làm mờ (blur)
 * thay vì để trống — nhìn gọn hơn dải đen/trắng.
 *
 * Dùng: <CoverImage src="..." className="aspect-[3/4] w-40 rounded-xl" />
 * (className quy định kích thước, bo góc, đổ bóng của khung)
 */
export default function CoverImage({
  src,
  alt = "",
  className = "",
  blur = true,
  eager = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  /** false: nền trơn thay vì ảnh mờ (dùng cho ảnh thu nhỏ trong danh sách cho nhẹ) */
  blur?: boolean;
  eager?: boolean;
}) {
  return (
    <span className={`relative block overflow-hidden bg-soft ${className}`}>
      {blur && (
        <img
          src={src}
          alt=""
          aria-hidden
          loading={eager ? "eager" : "lazy"}
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-2xl"
        />
      )}
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className="relative block h-full w-full object-contain" />
    </span>
  );
}
