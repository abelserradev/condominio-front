import {
  buildJsonAuthHeaders,
  buildMultipartAuthHeaders,
  resolveApiBaseUrl,
} from "./client-core";

const BUILDING_SLUG_COOKIE_RE = /(?:^|;\s*)building_slug=([^;]+)/;
const PLATFORM_MODE_COOKIE_RE = /(?:^|;\s*)platform_mode=1(?:;|$)/;

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

/** Dominio raíz de la plataforma (buildforge.work, localhost sin subdominio). */
export function esModoPlataforma(): boolean {
  if (globalThis.document === undefined) return false;
  return PLATFORM_MODE_COOKIE_RE.test(globalThis.document.cookie);
}

/**
 * Slug del tenant actual — solo cookie del middleware, sin fallback en plataforma.
 * Usado en login y auth scoped al edificio.
 */
export function getBuildingSlugTenant(): string {
  const fallbackDev =
    process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ?? "residencia-sofia";
  if (globalThis.document === undefined) return fallbackDev;
  const match = BUILDING_SLUG_COOKIE_RE.exec(globalThis.document.cookie);
  if (match?.[1]) return decodeURIComponent(match[1]);
  if (esModoPlataforma()) {
    throw new Error(
      "Este inicio de sesión es para el portal de un edificio. Accede desde la URL de tu condominio.",
    );
  }
  return fallbackDev;
}

export function getBuildingSlug(): string {
  const fallback =
    process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ?? "residencia-sofia";
  if (globalThis.document === undefined) return fallback;
  const match = BUILDING_SLUG_COOKIE_RE.exec(globalThis.document.cookie);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

export function getAuthToken(): string | null {
  if (globalThis.window === undefined) {
    return null;
  }
  try {
    return localStorage.getItem("admin_token");
  } catch (err) {
    console.error("[API] getAuthToken - Error al acceder a localStorage:", err);
    return null;
  }
}

export function getAuthHeaders(): HeadersInit {
  return buildJsonAuthHeaders({
    buildingSlug: getBuildingSlug(),
    bearerToken: getAuthToken(),
  });
}

export function getBaseHeaders(): HeadersInit {
  return buildMultipartAuthHeaders({
    buildingSlug: getBuildingSlug(),
    bearerToken: getAuthToken(),
  });
}
