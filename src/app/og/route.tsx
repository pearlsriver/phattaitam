import { ImageResponse } from "next/og";

/* Ảnh chia sẻ mặc định (khi bài viết không có ảnh). Chỉ dùng chữ không dấu
   vì font mặc định của trình tạo ảnh chưa hỗ trợ đủ dấu tiếng Việt. */

const size = { width: 1200, height: 630 };


export function GET() {
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
          background: "linear-gradient(135deg, #f7f3ec 0%, #f3e3cc 55%, #e0b75a 100%)",
          color: "#1f1a14",
        }}
      >
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: 40,
            background: "#9a5b1e",
            color: "#f7f3ec",
            fontSize: 120,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          P
        </div>
        <div style={{ marginTop: 40, fontSize: 40, letterSpacing: 12, color: "#7c4714" }}>PHATTAITAM.COM</div>
      </div>
    ),
    size,
  );
}
