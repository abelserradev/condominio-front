import { obtenerCsrfToken } from "./auth";
import {
  getApiBaseUrl,
  getAuthHeaders,
  getBuildingSlug,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

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
