import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [25, 50, 75, 100],
  },
  async rewrites() {
    return [
      {
        source: "/api/user/:path*",
        destination: "http://localhost:9100/:path*",
      },
    ];
  },
};

export default nextConfig;
