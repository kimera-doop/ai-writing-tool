import type { NextConfig } from "next";
import pkg from "./package.json";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // クリックジャッキング防止（iframeへの埋め込みを禁止）
          { key: "X-Frame-Options", value: "DENY" },
          // MIMEタイプのスニッフィング防止
          { key: "X-Content-Type-Options", value: "nosniff" },
          // リファラー情報の漏洩を最小限にする
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ブラウザの機能アクセスを必要最小限に制限
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // APIレスポンスはキャッシュしない（古い情報が使い回されるのを防ぐ）
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
