import type { NextConfig } from "next";
import { getBackendProxyTarget } from "./lib/backend-url";

function remotePatternsFromEnv(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl?.startsWith("http")) return patterns;

  try {
    const parsed = new URL(apiUrl);
    patterns.push({
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      pathname: "/files/**",
    });
  } catch {
    // URL mal formada en env — el proxy /api cubre banners en runtime
  }
  return patterns;
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: remotePatternsFromEnv(),
  },
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
