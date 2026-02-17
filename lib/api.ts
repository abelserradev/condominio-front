const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export async function obtenerCsrfToken(): Promise<string> {
  const res = await fetch(`${getBaseUrl()}/csrf/token`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("No se pudo obtener el token CSRF");
  const data = (await res.json()) as { csrfToken: string };
  if (!data?.csrfToken) throw new Error("Token CSRF vacío");
  return data.csrfToken;
}

export type Bank = { _id: string; nombre: string };

export async function fetchBanks(): Promise<Bank[]> {
  const res = await fetch(`${getBaseUrl()}/banks`);
  if (!res.ok) throw new Error("Error al cargar bancos");
  return res.json();
}

export type TasaBcv = { promedio: number; fechaActualizacion?: string };

export async function fetchTasaBcv(): Promise<TasaBcv> {
  const res = await fetch(`${getBaseUrl()}/tasa-bcv`);
  if (!res.ok) throw new Error("Error al cargar tasa BCV");
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
    cache: 'no-store',
  });
  if (!res.ok) throw new Error("Error al cargar pagos");
  return res.json();
}

export async function fetchPayment(id: string): Promise<Payment> {
  const res = await fetch(`${getBaseUrl()}/payments/${id}`);
  if (!res.ok) throw new Error("Error al cargar pago");
  return res.json();
}

export async function postPayment(formData: FormData): Promise<Payment> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/payments`, {
    method: "POST",
    headers: {
      "X-CSRF-Token": csrfToken,
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

export async function login(usuario: string, contraseña: string): Promise<{ access_token: string }> {
  const csrfToken = await obtenerCsrfToken();
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
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
  return res.json();
}

export type Apartment = {
  _id: string;
  piso: number;
  numero: number;
  idUnico: string;
};

export async function fetchApartments(piso?: number): Promise<Apartment[]> {
  const params = piso != null ? `?piso=${piso}` : "";
  const res = await fetch(`${getBaseUrl()}/apartments${params}`);
  if (!res.ok) throw new Error("Error al cargar apartamentos");
  return res.json();
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
  });
  if (!res.ok) {
    throw new Error("Error al cargar recibos");
  }
  return res.json();
}

export async function postRecibo(formData: FormData): Promise<Recibo> {
  const token = getAuthToken();
  const res = await fetch(`${getBaseUrl()}/administracion`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
    const res = await fetch(`${getBaseUrl()}/avisos`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
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
