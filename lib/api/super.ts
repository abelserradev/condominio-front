import { errorRegistroSeguro } from "./portal";
import {
  getApiBaseUrl,
  getAuthHeaders,
  getBaseHeaders,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

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
