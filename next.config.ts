import type { NextConfig } from "next";

/**
 * Security headers cho toàn bộ trang (CSP, HSTS, chống nhúng iframe…).
 * Địa chỉ Supabase và kho media được lấy từ biến môi trường lúc build.
 */
const isDev = process.env.NODE_ENV !== "production";
const supabase = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const media = (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/+$/, "");
const supabaseWs = supabase.replace(/^https:/, "wss:");

const csp = [
  "default-src 'self'",
  // Next.js cần 'unsafe-inline' cho script khởi tạo; 'unsafe-eval' chỉ khi chạy thử trên máy
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `media-src 'self' blob: ${media} ${supabase}`.trim(),
  // Tải tệp thẳng lên Cloudflare R2 qua URL đã ký
  `connect-src 'self' ${supabase} ${supabaseWs} ${media} https://*.r2.cloudflarestorage.com${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
