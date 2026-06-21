/** Hostnames de red Docker / Coolify — siempre HTTP, nunca forzar HTTPS */
function esHostInterno(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (!hostname.includes(".")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return true;
  if (/^[0-9a-f]{8,}$/i.test(hostname)) return true;
  return false;
}

/**
 * Normaliza la URL del backend para proxy server-side.
 * Solo convierte http→https en dominios públicos (api.buildforge.work).
 * URLs internas tipo http://api:3001 deben quedarse en HTTP.
 */
export function resolveBackendUrl(
  raw: string | undefined,
  fallback = "http://localhost:3001",
): string {
  if (!raw?.startsWith("http")) return fallback;

  const clean = raw.replace(/\/+$/, "");
  try {
    const host = new URL(clean).hostname;
    if (clean.startsWith("http://") && !esHostInterno(host)) {
      return clean.replace("http://", "https://");
    }
  } catch {
    return fallback;
  }
  return clean;
}

export function getBackendProxyTarget(): string {
  return resolveBackendUrl(
    process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL,
  );
}
