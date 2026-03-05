import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async rewrites() {
    // Solo proxy en desarrollo; en prod usamos NEXT_PUBLIC_API_URL
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:3001/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
