import {
  getApiBaseUrl,
  getAuthHeaders,
  getBaseHeaders,
  getBuildingSlug,
  getBuildingSlugTenant,
  getAuthToken,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

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
