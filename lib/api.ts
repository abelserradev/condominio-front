const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
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
  const res = await fetch(`${getBaseUrl()}/payments?${params}`);
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

export async function postPayment(formData: FormData): Promise<Payment> {
  const res = await fetch(`${getBaseUrl()}/payments`, {
    method: "POST",
    body: formData,
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
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuario, contraseña }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { message?: string }).message ?? "Error al iniciar sesión");
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