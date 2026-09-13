import { fetchPortalInfo } from "./portal";
import { getApiBaseUrl, getBuildingSlug } from "./http-session";

const getBaseUrl = getApiBaseUrl;

export type Apartment = {
  _id: string;
  piso: number;
  numero: number;
  idUnico: string;
};

/** Fallback cuando la colección apartamentos aún no tiene seed pero el edificio sí tiene config */
export function construirApartamentosDesdeConfig(
  totalPisos: number,
  apartamentosPorPiso: number,
): Apartment[] {
  const list: Apartment[] = [];
  for (let p = 1; p <= totalPisos; p++) {
    for (let a = 1; a <= apartamentosPorPiso; a++) {
      list.push({
        _id: `cfg-P${p}-A${a}`,
        piso: p,
        numero: a,
        idUnico: `P${p}-A${a}`,
      });
    }
  }
  return list;
}

/** Pisos/apartamentos del edificio: BD primero; si falla (403 suspendido, seed vacío), config del portal */
export async function fetchBuildingLayout(): Promise<Apartment[]> {
  try {
    const list = await fetchApartments();
    if (list.length > 0) return list;
  } catch {
    // SubscriptionGuard u otro error — caer al layout público del portal
  }

  const slug = getBuildingSlug();
  const portal = await fetchPortalInfo(slug);
  if (!portal) return [];
  return construirApartamentosDesdeConfig(
    portal.totalPisos,
    portal.apartamentosPorPiso,
  );
}

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
