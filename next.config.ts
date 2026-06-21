import type { NextConfig } from "next";
import { getBackendProxyTarget } from "./lib/backend-url";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async rewrites() {
    const target = getBackendProxyTarget();
    return [
      {
        source: "/api/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
