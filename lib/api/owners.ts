import {
  getApiBaseUrl,
  getAuthHeaders,
  getBaseHeaders,
  getBuildingSlug,
  getBuildingSlugTenant,
  getAuthToken,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

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
