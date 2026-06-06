import type { NextConfig } from "next";

// Backend origin (HTTP). Browser calls hit /api on our own HTTPS origin and Next
// proxies them server-side to this — avoids mixed-content blocking on Vercel.
const BACKEND = (process.env.NEXT_PUBLIC_API_URL || "http://3.213.111.199:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND}/:path*` }];
  },
};

export default nextConfig;
