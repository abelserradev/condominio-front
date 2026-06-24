import { resolveBackendUrl } from "./backend-url";

const getBaseUrl = (): string => {
  if (globalThis.window !== undefined) {
    return "/api";
  }

  return resolveBackendUrl(
    process.env.API_PROXY_TARGET ?? process.env.NEXT_PUBLIC_API_URL,
  );
};

const BUILDING_SLUG_COOKIE_RE = /(?:^|;\s*)building_slug=([^;]+)/;
const PLATFORM_MODE_COOKIE_RE = /(?:^|;\s*)platform_mode=1(?:;|$)/;

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
  const fallbackDev = process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ?? "residencia-sofia";
  if (globalThis.document === undefined) return fallbackDev;
  const match = BUILDING_SLUG_COOKIE_RE.exec(globalThis.document.cookie);
  if (match?.[1]) return decodeURIComponent(match[1]);
  if (esModoPlataforma()) {
    throw new Error("Este inicio de sesión es para el portal de un edificio. Accede desde la URL de tu condominio.");
  }
  return fallbackDev;
}

/**
 * Lee el slug del edificio actual desde la cookie que inyecta el middleware.
 * Fallback al valor de entorno para desarrollo sin subdominio.
 */
function getBuildingSlug(): string {
  const fallback = process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ?? "residencia-sofia";
  if (globalThis.document === undefined) return fallback;
  const match = BUILDING_SLUG_COOKIE_RE.exec(globalThis.document.cookie);
  return match?.[1] ? decodeURIComponent(match[1]) : fallback;
}

function getAuthToken(): string | null {
  if (globalThis.window === undefined) {
    return null;
  }
  try {
    return localStorage.getItem("admin_token");
  } catch (err) {
    console.error('[API] getAuthToken - Error al acceder a localStorage:', err);
    return null;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    "x-building-slug": getBuildingSlug(),
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Headers base sin Content-Type (para requests con FormData)
function getBaseHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "x-building-slug": getBuildingSlug(),
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function obtenerCsrfToken(): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/csrf/token`, {
    method: "GET",
    credentials: "include",
    // CSRF token es global — no necesita building context
  });
  if (!res.ok) throw new Error("No se pudo obtener el token CSRF");
  const data = (await res.json()) as { csrfToken: string };
  if (!data?.csrfToken) throw new Error("Token CSRF vacío");
  return data.csrfToken;
}

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

export type Payment = {
  _id: string;
  piso: number;
  apartamento: number;
  meses: number[];
  banco: string;
  fechaPago: string;
  numeroComprobante: string;
  montoUsd: number;
  montoBs?: number;
  tasaBcv?: number;
  comprobanteFileId?: string;
  recibosPagados?: string[];
  createdAt?: string;
  estado?: string;
};

export type Abono = {
  paymentId: string;
  monto: number;
  fecha: string;
  numeroComprobante?: string;
};

export type Recibo = {
  _id: string;
  piso: number;
  apartamento: number;
  meses: number[];
  montoUsd: number;
  tipoDeuda: string;
  fechaReportada: string;
  facturaFileId?: string;
  createdAt?: string;
  estado?: string;
  montoPagado?: number;
  abonos?: Abono[];
};

export async function fetchPayments(
  piso?: number,
  apartamento?: number,
  estado?: string
): Promise<Payment[]> {
  const params = new URLSearchParams();
  if (piso != null) params.append("piso", String(piso));
  if (apartamento != null) params.append("apartamento", String(apartamento));
  if (estado != null) params.append("estado", estado);
  // Agregar timestamp para evitar caché del navegador
  params.append("_t", String(Date.now()));
  const res = await fetch(`${getBaseUrl()}/payments?${params}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error("Error al cargar pagos");
  return res.json();
}

export async function fetchPayment(id: string): Promise<Payment> {
  const res = await fetch(`${getBaseUrl()}/payments/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Error al cargar pago");
  return res.json();
}

// Endpoint público para residentes — filtra estrictamente por piso y apartamento,
// sin exponer pagos de otros apartamentos ni requerir JWT
export async function fetchPaymentsByApartamento(
  piso: number,
  apartamento: number
): Promise<Payment[]> {
  const params = new URLSearchParams({
    piso: String(piso),
    apartamento: String(apartamento),
    _t: String(Date.now()),
  });
  const res = await fetch(
    `${getBaseUrl()}/payments/public/por-apartamento?${params}`,
    {
      cache: "no-store",
      headers: { "x-building-slug": getBuildingSlug() },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function postPayment(formData: FormData): Promise<Payment> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/payments`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken,
      "x-building-slug": getBuildingSlug(),
    },
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al reportar pago");
  }
  return res.json();
}

export async function aceptarPago(id: string): Promise<Payment> {
  const res = await fetch(`${getBaseUrl()}/payments/${id}/aceptar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al aceptar pago");
  }
  return res.json();
}

export async function rechazarPago(id: string): Promise<Payment> {
  const res = await fetch(`${getBaseUrl()}/payments/${id}/rechazar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al rechazar pago");
  }
  return res.json();
}

export function getComprobanteUrl(fileId: string): string {
  return `${getBaseUrl()}/files/${fileId}`;
}

export function getFileUrl(fileId: string): string {
  return getComprobanteUrl(fileId);
}

export type Reglamento = {
  nombre: string;
  fileId: string;
  actualizadoEn: string;
};

export async function fetchReglamento(): Promise<Reglamento | null> {
  const res = await fetch(`${getBaseUrl()}/reglamentos`, {
    headers: { "x-building-slug": getBuildingSlug() },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Error al cargar reglamento");
  return res.json();
}

export async function uploadReglamento(archivo: File): Promise<Reglamento> {
  const formData = new FormData();
  formData.append("archivo", archivo);
  const res = await fetch(`${getBaseUrl()}/reglamentos`, {
    method: "POST",
    headers: getBaseHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al subir reglamento");
  }
  return res.json();
}

export async function deleteReglamento(): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/reglamentos`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al eliminar reglamento");
  }
}

export type LoginResponse = {
  access_token: string;
  rol: string;
  edificio?: string;
  buildingId?: string;
  piso?: number;
  apartamento?: number;
  idUnico?: string;
};

export type BuildingSuscripcion = {
  nombre: string;
  slug: string;
  estadoSuscripcion: string;
  suscripcionHasta: string;
  diasGracia: number;
  datosContactoPago?: string;
};

export type SuperBuilding = {
  _id: string;
  slug: string;
  nombre: string;
  direccion?: string;
  totalPisos: number;
  apartamentosPorPiso: number;
  activo: boolean;
  estadoSuscripcion: string;
  suscripcionHasta?: string;
  diasGracia?: number;
  datosContactoPago?: string;
  historialRenovaciones?: Array<{
    fecha: string;
    renovadoPor: string;
    diasAgregados: number;
    nota?: string;
  }>;
  createdAt?: string;
};

async function ejecutarLogin(
  usuario: string,
  contraseña: string,
  headersExtra: HeadersInit,
): Promise<LoginResponse> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
      ...headersExtra,
    },
    body: JSON.stringify({ usuario: usuario.trim(), contraseña }),
    credentials: "include",
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Credenciales inválidas");
    }
    const text = await res.text();
    let msg = "Error al iniciar sesión";
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      if (text) msg = text;
    }
    throw new Error(msg);
  }
  return res.json() as Promise<LoginResponse>;
}

/** SuperAdmin en dominio raíz — sin contexto de edificio. */
export async function loginPlataforma(usuario: string, contraseña: string): Promise<LoginResponse> {
  return ejecutarLogin(usuario, contraseña, {});
}

/** Admin / propietario en portal del condominio — requiere slug del tenant. */
export async function loginEdificio(usuario: string, contraseña: string): Promise<LoginResponse> {
  return ejecutarLogin(usuario, contraseña, {
    "x-building-slug": getBuildingSlugTenant(),
  });
}

/** @deprecated Preferir loginEdificio o loginPlataforma según el portal. */
export async function login(usuario: string, contraseña: string): Promise<LoginResponse> {
  return loginEdificio(usuario, contraseña);
}

export type Apartment = {
  _id: string;
  piso: number;
  numero: number;
  idUnico: string;
};

export async function fetchApartments(piso?: number): Promise<Apartment[]> {
  const params = typeof piso === "number" ? `?piso=${piso}` : "";
  const res = await fetch(`${getBaseUrl()}/apartments${params}`, {
    headers: { "x-building-slug": getBuildingSlug() },
  });
  if (!res.ok) throw new Error("Error al cargar apartamentos");
  return res.json();
}

/**
 * Obtiene el abono (crédito) disponible para el apartamento.
 * Si el endpoint no existe (404) o falla, retorna 0 para no romper la UX.
 */
export async function fetchAbono(piso: number, apartamento: number): Promise<number> {
  try {
    const params = new URLSearchParams({ piso: String(piso), apartamento: String(apartamento) });
    params.append("_t", String(Date.now()));
    const res = await fetch(`${getBaseUrl()}/administracion/public/abono?${params}`, {
      cache: "no-store",
      headers: { "x-building-slug": getBuildingSlug() },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { monto: number };
    return data.monto ?? 0;
  } catch {
    return 0;
  }
}

export async function fetchRecibos(
  piso?: number,
  apartamento?: number,
  estado?: string
): Promise<Recibo[]> {
  const token = getAuthToken();
  // Si es admin autenticado, siempre usar endpoint privado para ver todos los recibos
  if (token) {
    const params = new URLSearchParams();
    if (piso != null) params.append("piso", String(piso));
    if (apartamento != null) params.append("apartamento", String(apartamento));
    if (estado != null) params.append("estado", estado);
    // Agregar timestamp para evitar caché del navegador
    params.append("_t", String(Date.now()));
    const res = await fetch(`${getBaseUrl()}/administracion?${params}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error("Error al cargar recibos");
    }
    return res.json();
  }
  // Para propietarios, usar endpoint público que muestra recibos con saldo pendiente
  const publicParams = new URLSearchParams();
  if (piso != null) publicParams.append("piso", String(piso));
  if (apartamento != null) publicParams.append("apartamento", String(apartamento));
  const res = await fetch(`${getBaseUrl()}/administracion/public/pendientes?${publicParams}`, {
    cache: 'no-store',
    headers: { "x-building-slug": getBuildingSlug() },
  });
  if (!res.ok) {
    throw new Error("Error al cargar recibos");
  }
  return res.json();
}

export async function postRecibo(formData: FormData): Promise<Recibo> {
  const res = await fetch(`${getBaseUrl()}/administracion`, {
    method: "POST",
    headers: getBaseHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al cargar recibo");
  }
  return res.json();
}

export type AvisoPrioridad = "alta" | "media" | "baja";
export type AvisoEstado = "publicado" | "borrador";
export type AvisoTipo =
  | "evento"
  | "inconveniente"
  | "aviso_general"
  | "comunicado_oficial";

export type Aviso = {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: AvisoTipo;
  prioridad?: AvisoPrioridad;
  estado?: AvisoEstado;
  createdAt?: string;
};

export async function fetchAvisos(): Promise<Aviso[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/avisos`, {
      cache: "no-store",
      headers: { "x-building-slug": getBuildingSlug() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

const AVISOS_DEVICE_ID_KEY = "avisos_device_id";

export function getOrCreateDeviceId(): string {
  if (globalThis.window === undefined) return "";
  let id = localStorage.getItem(AVISOS_DEVICE_ID_KEY);
  if (!id) {
    id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(AVISOS_DEVICE_ID_KEY, id);
  }
  return id;
}

export async function fetchUnreadAvisosCount(deviceId: string): Promise<number> {
  try {
    const res = await fetch(`${getBaseUrl()}/avisos/unread-count?deviceId=${encodeURIComponent(deviceId)}`, {
      cache: "no-store",
      headers: { "x-building-slug": getBuildingSlug() },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

export async function markAvisosRead(deviceId: string): Promise<void> {
  try {
    await fetch(`${getBaseUrl()}/avisos/mark-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });
  } catch {
    //
  }
}

export async function createAviso(body: {
  titulo: string;
  mensaje: string;
  tipo: AvisoTipo;
  prioridad?: AvisoPrioridad;
  estado?: AvisoEstado;
}): Promise<Aviso> {
  const res = await fetch(`${getBaseUrl()}/avisos`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al crear aviso");
  }
  return res.json();
}

export async function updateAviso(
  id: string,
  body: Partial<Pick<Aviso, "titulo" | "mensaje" | "tipo" | "prioridad" | "estado">>
): Promise<Aviso> {
  const res = await fetch(`${getBaseUrl()}/avisos/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al actualizar aviso");
  }
  return res.json();
}

export async function deleteAviso(id: string): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/avisos/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al eliminar aviso");
  }
}

export async function fetchMiSuscripcion(): Promise<BuildingSuscripcion> {
  const res = await fetch(`${getBaseUrl()}/buildings/suscripcion`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo cargar la suscripción del edificio");
  return res.json();
}

export async function fetchSuperBuildings(): Promise<SuperBuilding[]> {
  const res = await fetch(`${getBaseUrl()}/super/buildings`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar edificios");
  return res.json();
}

export async function fetchSuperBuilding(id: string): Promise<SuperBuilding> {
  const res = await fetch(`${getBaseUrl()}/super/buildings/${id}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Edificio no encontrado");
  return res.json();
}

export async function renovarSuperBuilding(
  id: string,
  diasAgregados: number,
  nota?: string,
): Promise<SuperBuilding> {
  const res = await fetch(`${getBaseUrl()}/super/buildings/${id}/renovar`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ diasAgregados, nota }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al renovar");
  }
  return res.json();
}

export async function suspenderSuperBuilding(id: string): Promise<SuperBuilding> {
  const res = await fetch(`${getBaseUrl()}/super/buildings/${id}/suspender`, {
    method: "PATCH",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al suspender");
  }
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

export async function subirPortalBannerSuper(
  buildingId: string,
  file: File,
): Promise<{ bannerUrl: string }> {
  const formData = new FormData();
  formData.append("banner", file);
  const res = await fetch(
    `${getBaseUrl()}/super/buildings/${buildingId}/portal-banner`,
    {
      method: "POST",
      headers: getBaseHeaders(),
      body: formData,
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Error al subir banner",
    );
  }
  return res.json();
}

export async function eliminarPortalBannerSuper(
  buildingId: string,
): Promise<void> {
  const res = await fetch(
    `${getBaseUrl()}/super/buildings/${buildingId}/portal-banner/eliminar`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Error al eliminar banner",
    );
  }
}

export async function crearSuperBuilding(data: {
  slug: string;
  nombre: string;
  totalPisos: number;
  apartamentosPorPiso: number;
  adminEmail: string;
  adminPassword: string;
  direccion?: string;
  datosContactoPago?: string;
}): Promise<SuperBuilding> {
  const res = await fetch(`${getBaseUrl()}/super/buildings`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw errorRegistroSeguro(res, err);
  }
  return res.json();
}

export type RegisterBuildingResult = {
  slug: string;
  nombre: string;
  portalUrl: string;
  trialHasta: string;
  buildingId: string;
  adminEmail?: string;
};

/** Verifica disponibilidad de subdominio — no requiere contexto de edificio */
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

/** Registro público self-service (Fase 3) */
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

export type BuildingAdminInfo = {
  usuario: string;
  email?: string;
  portalUrl: string;
};

export async function fetchSuperBuildingAdmin(id: string): Promise<BuildingAdminInfo> {
  const res = await fetch(`${getBaseUrl()}/super/buildings/${id}/admin`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al cargar admin");
  }
  return res.json();
}

export async function resetSuperBuildingAdmin(
  id: string,
  nuevaPassword: string,
): Promise<{ ok: true; usuario: string }> {
  const res = await fetch(`${getBaseUrl()}/super/buildings/${id}/reset-admin`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ nuevaPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al restablecer contraseña");
  }
  return res.json();
}

export type Owner = {
  _id: string;
  nombre: string;
  email: string;
  piso: number;
  apartamento: number;
  idUnico: string;
  rol: "propietario" | "inquilino";
  activo: boolean;
  createdAt?: string;
};

export async function fetchOwners(incluirInactivos = false): Promise<Owner[]> {
  const q = incluirInactivos ? "?incluirInactivos=true" : "";
  const res = await fetch(`${getBaseUrl()}/owners${q}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Error al cargar propietarios");
  return res.json();
}

export async function createOwner(data: {
  nombre: string;
  email: string;
  piso: number;
  apartamento: number;
  rol: "propietario" | "inquilino";
  password: string;
}): Promise<Owner> {
  const res = await fetch(`${getBaseUrl()}/owners`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al crear propietario");
  }
  return res.json();
}

export async function updateOwner(
  id: string,
  data: Partial<{
    nombre: string;
    email: string;
    piso: number;
    apartamento: number;
    rol: "propietario" | "inquilino";
    activo: boolean;
    password: string;
  }>,
): Promise<Owner> {
  const res = await fetch(`${getBaseUrl()}/owners/${id}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al actualizar");
  }
  return res.json();
}

export async function deactivateOwner(id: string): Promise<Owner> {
  const res = await fetch(`${getBaseUrl()}/owners/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Error al desactivar");
  }
  return res.json();
}

export async function changeMyPassword(
  contraseñaActual: string,
  contraseñaNueva: string,
): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/owners/me/password`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ contraseñaActual, contraseñaNueva }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "No se pudo cambiar la contraseña");
  }
}
