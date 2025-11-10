// app/api/captcha/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Random chuỗi 5–6 ký tự
function randomText(len = 6) {
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

// Tạo SVG đơn giản + vài đường nhiễu
function svgCaptcha(text: string) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#111"/>
      <stop offset="100%" stop-color="#333"/>
    </linearGradient>
  </defs>
  <rect width="120" height="40" fill="url(#g)"/>
  <g fill="#fff" font-family="monospace" font-size="22" font-weight="700">
    <text x="12" y="27" letter-spacing="2">${text}</text>
  </g>
  <g stroke="#888" stroke-width="1" opacity="0.6">
    <line x1="0" y1="8" x2="120" y2="12"/>
    <line x1="0" y1="28" x2="120" y2="22"/>
  </g>
</svg>`;
}

export async function GET() {
  const code = randomText(6);

  // Lưu tạm vào cookie để server có thể kiểm tra (demo: lưu plain)
  cookies().set({
    name: "captcha_code",
    value: code,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5, // 5 phút
  });

  const svg = svgCaptcha(code);

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // chống cache
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
