import imageCompression from "browser-image-compression";
import {
  fetchTasaBcv,
  fetchTasaBcvPorFecha,
  type Bank,
} from "@/lib/api";

export async function comprimirImagen(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  };
  return imageCompression(file, options);
}

export function normalizarFechaAISO(fechaRaw: string): string | null {
  const s = String(fechaRaw).trim();
  if (!s) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const date = new Date(
      Number.parseInt(y, 10),
      Number.parseInt(m, 10) - 1,
      Number.parseInt(d, 10),
    );
    if (!Number.isNaN(date.getTime())) return isoMatch[0];
    return null;
  }
  const ddmmyyyy = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/.exec(s);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const date = new Date(
      Number.parseInt(y, 10),
      Number.parseInt(m, 10) - 1,
      Number.parseInt(d, 10),
    );
    if (!Number.isNaN(date.getTime())) return iso;
    return null;
  }
  return null;
}

export function esFechaRazonable(iso: string): boolean {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  const haceUnAnio = new Date();
  haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);
  return date <= hoy && date >= haceUnAnio;
}

export function formatFechaParaUsuario(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export type ValidacionArchivoResult =
  | { valido: true }
  | { valido: false; error: string };

export function validarArchivo(file: File): ValidacionArchivoResult {
  const MAX_SIZE_MB = 5;
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

  if (file.size > MAX_SIZE_BYTES) {
    return {
      valido: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${MAX_SIZE_MB}MB`,
    };
  }

  if (!file.type.startsWith("image/")) {
    return { valido: false, error: "Solo se permiten archivos de imagen" };
  }

  return { valido: true };
}

export function encontrarBancoPorNombre(
  bancos: Bank[],
  nombreExtraido: string,
): Bank | undefined {
  const bancoLower = nombreExtraido.toLowerCase();
  const bancoMatch = bancos.find(
    (b) =>
      bancoLower.includes(b.nombre.toLowerCase()) ||
      b.nombre.toLowerCase().includes(bancoLower),
  );
  if (bancoMatch) return bancoMatch;

  if (bancoLower.includes("pagomóvil") || bancoLower.includes("bdv")) {
    return bancos.find((b) =>
      b.nombre.toLowerCase().includes("banco de venezuela"),
    );
  }
  return undefined;
}

export function procesarFechaExtraida(fechaRaw: string | undefined): string | null {
  if (!fechaRaw) return null;
  const normalizada = normalizarFechaAISO(fechaRaw);
  if (normalizada) return normalizada;

  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(fechaRaw);
  return d ? d[0] : fechaRaw;
}

export async function obtenerTasaParaCalculo(
  fecha: string | null,
  tasaActual: number | null,
): Promise<{ tasa: number | null; error: string | null }> {
  if (!fecha || !esFechaRazonable(fecha)) {
    return { tasa: tasaActual, error: null };
  }

  try {
    const data = await fetchTasaBcvPorFecha(fecha);
    return { tasa: data.promedio, error: null };
  } catch {
    try {
      const data = await fetchTasaBcv();
      return {
        tasa: data.promedio,
        error:
          "No hay tasa histórica para esa fecha. Usando tasa del día actual.",
      };
    } catch {
      return {
        tasa: tasaActual,
        error:
          "No hay tasa histórica para esa fecha. Usando tasa del día actual.",
      };
    }
  }
}

export function calcularMontosDesdeOcr(
  extract: { montoBs?: number | null; montoUsd?: number | null },
  tasa: number | null,
): { montoBs: string | null; montoUsd: string | null } {
  let montoBs: string | null = null;
  let montoUsd: string | null = null;

  if (extract.montoBs != null && extract.montoBs > 0) {
    montoBs = extract.montoBs.toFixed(2);
  }
  if (extract.montoUsd != null && extract.montoUsd > 0) {
    montoUsd = extract.montoUsd.toFixed(2);
  } else if (
    extract.montoBs != null &&
    extract.montoBs > 0 &&
    tasa != null &&
    tasa > 0
  ) {
    montoUsd = (extract.montoBs / tasa).toFixed(2);
  }

  return { montoBs, montoUsd };
}

export function getLabelTextoArchivo(
  comprimiendo: boolean,
  extrayendoOcr: boolean,
  archivo: File | null,
): string {
  if (comprimiendo) {
    return "Comprimiendo imagen...";
  }
  if (extrayendoOcr) {
    return "Extrayendo datos del comprobante...";
  }
  if (archivo) {
    return `Archivo: ${archivo.name} (${(archivo.size / 1024 / 1024).toFixed(2)} MB)`;
  }
  return "Seleccionar imagen desde dispositivo";
}
