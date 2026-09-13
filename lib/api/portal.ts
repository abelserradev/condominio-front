import { obtenerCsrfToken } from "./auth";
import {
  getApiBaseUrl,
  getAuthHeaders,
  getBuildingSlug,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

export type ComprobanteExtraction = {
  banco?: string;
  fechaPago?: string;
  numeroComprobante?: string;
  montoBs?: number;
  montoUsd?: number;
};

export async function extractComprobante(file: File): Promise<ComprobanteExtraction> {
  const formData = new FormData();
  formData.append("comprobante", file);
  const res = await fetch(`${getBaseUrl()}/ocr/extract-receipt`, {
    method: "POST",
    headers: { "x-building-slug": getBuildingSlug() },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ??
        "No pudimos leer el comprobante automáticamente. Por favor complete los datos manualmente."
    );
  }
  return res.json();
}

export type Bank = { _id: string; nombre: string };

export async function fetchBanks(): Promise<Bank[]> {
  // Bancos son globales (no dependen del edificio), pero enviamos el slug igualmente
  // para que el backend pueda validar el contexto si en el futuro se necesita
  const res = await fetch(`${getBaseUrl()}/banks`, {
    headers: { "x-building-slug": getBuildingSlug() },
  });
  if (!res.ok) throw new Error("Error al cargar bancos");
  return res.json();
}

export type TasaBcv = { promedio: number; fechaActualizacion?: string };

export async function fetchTasaBcv(): Promise<TasaBcv> {
  const res = await fetch(`${getBaseUrl()}/tasa-bcv?_t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar tasa BCV");
  return res.json();
}

export async function fetchTasaBcvPorFecha(fecha: string): Promise<TasaBcv> {
  const res = await fetch(`${getBaseUrl()}/tasa-bcv/${fecha}?_t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar tasa BCV histórica");
  return res.json();
}
export type PortalInfo = {
  nombre: string;
  slug: string;
  activo: boolean;
  estadoSuscripcion: string;
  suscripcionHasta?: string;
  diasGracia: number;
  portalAccesible: boolean;
  motivoBloqueo?: "suspendido" | "vencido";
  bannerUrl?: string;
  datosContactoPago?: string;
  totalPisos: number;
  apartamentosPorPiso: number;
};

/** SSR: slug desde headers/cookie del middleware */
export async function resolveBuildingSlugServer(): Promise<string> {
  const { headers, cookies } = await import("next/headers");
  const headersList = await headers();
  const cookieStore = await cookies();
  return (
    headersList.get("x-building-slug") ??
    cookieStore.get("building_slug")?.value ??
    process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ??
    "residencia-sofia"
  );
}

export async function fetchPortalInfo(slug: string): Promise<PortalInfo | null> {
  const slugNorm = slug.trim().toLowerCase();
  const res = await fetch(
    `${getBaseUrl()}/buildings/portal?slug=${encodeURIComponent(slugNorm)}`,
    {
      headers: { "x-building-slug": slugNorm },
      cache: "no-store",
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar la información del portal");
  return res.json();
}

/** Comprobantes/banners del backend pasan por /api (misma origen) — evita 400 en next/image */
export function resolveBannerUrl(bannerUrl?: string): string | undefined {
  if (!bannerUrl) return undefined;

  let path = bannerUrl;
  if (bannerUrl.startsWith("http")) {
    try {
      path = new URL(bannerUrl).pathname;
    } catch {
      return bannerUrl;
    }
  }

  const normalizado = path.startsWith("/") ? path : `/${path}`;
  if (normalizado.startsWith("/files/")) {
    return `/api${normalizado}`;
  }
  return normalizado;
}

export type BuildingSuscripcion = {
  nombre: string;
  slug: string;
  estadoSuscripcion: string;
  suscripcionHasta: string;
  diasGracia: number;
  datosContactoPago?: string;
  totalPisos: number;
  apartamentosPorPiso: number;
};

export async function fetchMiSuscripcion(): Promise<BuildingSuscripcion> {
  const res = await fetch(`${getBaseUrl()}/buildings/suscripcion`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo cargar la suscripción del edificio");
  return res.json();
}

const MENSAJE_REGISTRO_GENERICO =
  "No se pudo completar el registro. Revisa los datos o contacta soporte.";

function errorRegistroSeguro(res: Response, err: unknown): Error {
  if (res.status === 409) {
    return new Error(MENSAJE_REGISTRO_GENERICO);
  }
  const msg = (err as { message?: string | string[] }).message;
  const texto = Array.isArray(msg) ? msg.join(", ") : msg;
  if (
    texto &&
    (/ya está registrado|ya existe|already exists/i.test(texto) ||
      /@/.test(texto))
  ) {
    return new Error(MENSAJE_REGISTRO_GENERICO);
  }
  return new Error(texto ?? MENSAJE_REGISTRO_GENERICO);
}

export type RegisterBuildingResult = {
  slug: string;
  nombre: string;
  portalUrl: string;
  trialHasta: string;
  buildingId: string;
  adminEmail?: string;
};

export async function checkBuildingSlug(
  slug: string,
): Promise<{ disponible: boolean; motivo?: string }> {
  const res = await fetch(
    `${getBaseUrl()}/buildings/check-slug/${encodeURIComponent(slug.trim().toLowerCase())}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("No se pudo verificar el subdominio");
  return res.json();
}

export async function registerBuilding(data: {
  slug: string;
  nombre: string;
  totalPisos: number;
  apartamentosPorPiso: number;
  adminEmail: string;
  adminPassword: string;
  direccion?: string;
}): Promise<RegisterBuildingResult> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/buildings/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(data),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw errorRegistroSeguro(res, err);
  }
  return res.json();
}

export { errorRegistroSeguro };
