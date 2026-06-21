import type { NextConfig } from "next";

/** Destino del proxy /api → backend (solo server-side, nunca expuesto al browser) */
function getApiProxyTarget(): string {
  const raw =
    process.env.API_PROXY_TARGET ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:3001";
  const clean = raw.replace(/\/+$/, "");
  const isLocal = clean.includes("localhost") || clean.includes("127.0.0.1");
  if (!isLocal && clean.startsWith("http://")) {
    return clean.replace("http://", "https://");
  }
  return clean;
}

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  async rewrites() {
    const target = getApiProxyTarget();
    return [
      {
        source: "/api/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;
