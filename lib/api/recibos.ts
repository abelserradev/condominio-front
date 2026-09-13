import {
  getApiBaseUrl,
  getAuthHeaders,
  getAuthToken,
  getBaseHeaders,
  getBuildingSlug,
} from "./http-session";

const getBaseUrl = getApiBaseUrl;

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

// --- Reporte de cobranza (backend es la fuente de verdad: mismo DTO para
// resumen admin y Excel; ver specs/api/reporte-cobranza-api-v1.md) ---

export type CategoriaCobranza = "al_dia" | "moroso";

export type FilaCobranza = {
  piso: number;
  apartamento: number;
  idUnico: string;
  categoria: CategoriaCobranza;
  saldoBrutoUsd: number;
  abonoUsd: number;
  saldoNetoUsd: number;
  mesesPendientes: number[];
  tiposDeuda: string[];
  tienePagoEnRevision: boolean;
  cantidadPagosEnRevision: number;
  montoEnRevisionUsd: number;
  propietario: string | null;
  emailPropietario: string | null;
};

export type ReporteCobranza = {
  generadoEn: string;
  resumen: {
    totalApartamentos: number;
    alDia: number;
    morosos: number;
    enRevision: number;
  };
  filas: FilaCobranza[];
};

export async function fetchReporteCobranza(
  filtro?: "todos" | "al_dia" | "moroso"
): Promise<ReporteCobranza> {
  const params = new URLSearchParams({ format: "json" });
  if (filtro && filtro !== "todos") params.append("filtro", filtro);
  params.append("_t", String(Date.now()));
  const res = await fetch(
    `${getBaseUrl()}/administracion/reporte/cobranza?${params}`,
    { headers: getAuthHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error("Error al cargar el reporte de cobranza");
  return res.json();
}

export type EstadoJobExcel = "pending" | "ready" | "failed";

export type CobranzaJobResponse = {
  jobId: string;
  estado: EstadoJobExcel;
  creadoEn: string;
  listoEn?: string;
  downloadUrl?: string;
  error?: string;
};

export async function crearJobReporteCobranzaExcel(
  filtro?: "todos" | "al_dia" | "moroso"
): Promise<{ jobId: string; estado: "pending"; creadoEn: string }> {
  const res = await fetch(
    `${getBaseUrl()}/administracion/reporte/cobranza/jobs`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: filtro ? JSON.stringify({ filtro }) : undefined,
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Error al encolar el reporte Excel"
    );
  }
  return res.json();
}

export async function consultarJobReporteCobranzaExcel(
  jobId: string
): Promise<CobranzaJobResponse> {
  const res = await fetch(
    `${getBaseUrl()}/administracion/reporte/cobranza/jobs/${jobId}`,
    { headers: getAuthHeaders() }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Error al consultar job"
    );
  }
  return res.json();
}

export async function descargarJobReporteCobranzaExcel(
  downloadUrl: string,
  filename?: string
): Promise<void> {
  const res = await fetch(`${getBaseUrl()}${downloadUrl}`, {
    headers: getBaseHeaders(),
  });
  if (!res.ok) throw new Error("Error al descargar el reporte de cobranza");
  const blob = await res.blob();
  const match = /filename="([^"]+)"/.exec(
    res.headers.get("Content-Disposition") ?? ""
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? match?.[1] ?? "reporte-cobranza.xlsx";
  link.click();
  URL.revokeObjectURL(url);
}

export async function descargarReporteCobranzaExcel(
  filtro?: "todos" | "al_dia" | "moroso",
  onStatus?: (estado: EstadoJobExcel) => void
): Promise<void> {
  const job = await crearJobReporteCobranzaExcel(filtro);
  onStatus?.(job.estado);

  const consultar = async (): Promise<CobranzaJobResponse> => {
    const estado = await consultarJobReporteCobranzaExcel(job.jobId);
    onStatus?.(estado.estado);
    return estado;
  };

  // Poll cada 1.5 s hasta 60 s
  const maxIntentos = 40;
  for (let i = 0; i < maxIntentos; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const estado = await consultar();
    if (estado.estado === "ready" && estado.downloadUrl) {
      await descargarJobReporteCobranzaExcel(estado.downloadUrl);
      return;
    }
    if (estado.estado === "failed") {
      throw new Error(estado.error ?? "Error generando el reporte Excel");
    }
  }
  throw new Error("El reporte tardó demasiado; intenta consultar el job más tarde");
}
