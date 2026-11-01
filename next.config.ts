import type { NextConfig } from "next";

const GATEWAY_URL = process.env.API_GATEWAY_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/gateway/:path*",
        destination: `${GATEWAY_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
