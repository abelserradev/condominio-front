const getBaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url && url.startsWith("http")) return url;
  if (typeof window !== "undefined") return "/api";
  return "http://localhost:3001";
};

/**
 * Lee el slug del edificio actual desde la cookie que inyecta el middleware.
 * Fallback al valor de entorno para desarrollo sin subdominio.
 */
function getBuildingSlug(): string {
  const fallback = process.env.NEXT_PUBLIC_DEV_BUILDING_SLUG ?? "residencia-sofia";
  if (typeof document === "undefined") return fallback;
  const match = document.cookie.match(/(?:^|;\s*)building_slug=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : fallback;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") {
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
  const res = await fetch(`${getBaseUrl()}/tasa-bcv`);
  if (!res.ok) throw new Error("Error al cargar tasa BCV");
  return res.json();
}

export async function fetchTasaBcvPorFecha(fecha: string): Promise<TasaBcv> {
  const res = await fetch(`${getBaseUrl()}/tasa-bcv/${fecha}`);
  if (!res.ok) throw new Error("Error al cargar tasa BCV histórica");
  return res.json();
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

export async function login(usuario: string, contraseña: string): Promise<LoginResponse> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
      // El slug le indica al backend en cuál edificio buscar al usuario
      "x-building-slug": getBuildingSlug(),
    },
    body: JSON.stringify({ usuario: usuario.trim(), contraseña }),
    credentials: "include",
  });
  if (!res.ok) {
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

export type Apartment = {
  _id: string;
  piso: number;
  numero: number;
  idUnico: string;
};

export async function fetchApartments(piso?: number): Promise<Apartment[]> {
  const params = piso != null ? `?piso=${piso}` : "";
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
  if (typeof window === "undefined") return "";
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

export async function crearSuperBuilding(data: {
  slug: string;
  nombre: string;
  totalPisos: number;
  apartamentosPorPiso: number;
  adminUsuario: string;
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
    throw new Error((err as { message?: string }).message ?? "Error al crear edificio");
  }
  return res.json();
}

export type RegisterBuildingResult = {
  slug: string;
  nombre: string;
  portalUrl: string;
  trialHasta: string;
  buildingId: string;
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
  adminUsuario: string;
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
    const msg = (err as { message?: string | string[] }).message;
    throw new Error(
      Array.isArray(msg) ? msg.join(", ") : (msg ?? "Error al registrar edificio"),
    );
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
