import { ImageResponse } from "next/og";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const size = { width: 1200, height: 630 };

/* Ảnh chia sẻ mặc định (khi bài viết không có ảnh): logo + tên website.
   Chỉ dùng chữ không dấu vì font mặc định của trình tạo ảnh chưa hỗ trợ đủ dấu tiếng Việt. */
export async function GET() {
  let logo: string | null = null;
  try {
    const res = await fetch(`${SITE_URL}/logo.png`);
    if (res.ok) logo = `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0d0b08 0%, #221c14 60%, #3a2c1a 100%)",
          color: "#f4ecdc",
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={300} height={300} alt="" style={{ borderRadius: 150 }} />
        ) : (
          <div style={{ width: 200, height: 200, borderRadius: 100, background: "#e2b04a", color: "#1c1408", fontSize: 130, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>P</div>
        )}
        <div style={{ marginTop: 36, fontSize: 44, letterSpacing: 12, color: "#e2b04a" }}>PHATTAITAM.COM</div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
