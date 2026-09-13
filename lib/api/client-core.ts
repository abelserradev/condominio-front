import { resolveBackendUrl } from "../backend-url";

/** Base URL del proxy `/api` en browser o backend directo en SSR. */
export function resolveApiBaseUrl(options?: {
  isBrowser?: boolean;
  serverEnvUrl?: string | undefined;
}): string {
  const isBrowser = options?.isBrowser ?? globalThis.window !== undefined;
  if (isBrowser) {
    return "/api";
  }
  const raw =
    options?.serverEnvUrl ??
    process.env.API_PROXY_TARGET ??
    process.env.NEXT_PUBLIC_API_URL;
  return resolveBackendUrl(raw);
}

export function buildJsonAuthHeaders(params: {
  buildingSlug: string;
  bearerToken: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-building-slug": params.buildingSlug,
  };
  if (params.bearerToken) {
    headers.Authorization = `Bearer ${params.bearerToken}`;
  }
  return headers;
}

export function buildMultipartAuthHeaders(params: {
  buildingSlug: string;
  bearerToken: string | null;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "x-building-slug": params.buildingSlug,
  };
  if (params.bearerToken) {
    headers.Authorization = `Bearer ${params.bearerToken}`;
  }
  return headers;
}
